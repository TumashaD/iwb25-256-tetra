'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { UserService } from '@/services/userService'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import type { User } from '@/types/user'
import type { Profile } from '@/services/userService'


type AuthContextType = {
  user: User | null
  loading: boolean
  error: string | null
  signOut: () => Promise<void>
  signUpWithGoogle: () => Promise<{ provider: string; url: string; }>
  createUserProfile: (userData: Omit<Profile, 'id' | 'createdAt'>) => Promise<void>
  updateUserProfile: (userData: Partial<Profile>) => Promise<void>
  refreshUserProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  // Internal states
  const [authUser, setAuthUser] = useState<SupabaseUser | null>(null)
  const [userProfile, setUserProfile] = useState<Profile | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [userLoading, setUserLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const supabase = createClient()

  // Function to fetch user profile from your users table
  const fetchUserProfile = async (userId: string) => {
    try {
      setUserLoading(true)
      setError(null)
      const profile = await UserService.getUser(userId)
      setUserProfile(profile)
    } catch (err) {
      // If it's a 404 or "user not found" error, that's expected for new users
      // Set user to null but don't set an error
      setUserProfile(null)
      // Only set error for actual API/network failures
      if (err instanceof Error && !err.message.includes('not found') && !err.message.includes('404')) {
        setError(err.message)
      }
    } finally {
      setUserLoading(false)
    }
  }

  // Initialize auth state and listen for changes
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setAuthUser(user)
      setAuthLoading(false)
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setAuthUser(session?.user ?? null)
        setAuthLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  // Fetch user profile when auth user changes
  useEffect(() => {
    if (authUser?.id) {
      fetchUserProfile(authUser.id)
    } else {
      setUserProfile(null)
      setUserLoading(false)
    }
  }, [authUser?.id])

  // Auth methods
  const signOut = async () => {
    await supabase.auth.signOut()
    setUserProfile(null) // Clear user profile when signing out
  }

  const signUpWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        queryParams: {
          prompt: 'select_account'
        },
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    
    if (error) {
      throw error
    }
    
    return data
  }

  // User profile methods
  const createUserProfile = async (userData: Omit<Profile, 'id' | 'createdAt'>) => {
    if (!authUser?.id) {
      throw new Error('User must be authenticated to create profile')
    }

    // Prevent duplicate requests
    if (userLoading) {
      return
    }

    try {
      setUserLoading(true)
      setError(null)
      
      const userDataToSend = {
        ...userData,
        id: authUser.id,
        email: authUser.email || userData.email,
      }
      
      const response = await UserService.createUser(userDataToSend)
      
      // Handle the Ballerina API response structure which returns { user: User, message: string, timestamp: string }
      const newUser = (response as any).user || response
      setUserProfile(newUser)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create user profile'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setUserLoading(false)
    }
  }

  const updateUserProfile = async (userData: Partial<Profile>) => {
    if (!authUser?.id || !userProfile) {
      throw new Error('User must be authenticated and have existing profile to update')
    }

    try {
      setUserLoading(true)
      setError(null)
      
      // Use the updateUser method instead of createUser
      const updatedUser = await UserService.updateUser(authUser.id, userData)

      setUserProfile(updatedUser)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update user profile'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setUserLoading(false)
    }
  }

  const refreshUserProfile = async () => {
    if (authUser?.id) {
      await fetchUserProfile(authUser.id)
    }
  }

  // Merge authUser and user profile into a single currentUser
  let currentUser: User | null = null;
  if (authUser && userProfile) {
    currentUser = {
      id: authUser.id,
      email: authUser.email ?? '',
      isAuthenticated: !!authUser,
      profile: userProfile,
      avatarUrl: authUser.user_metadata?.avatar_url || '',
    }
  }

  // Loading is true if either auth is loading OR if we have an auth user but no profile yet
  const loading = authLoading || userLoading || (!!authUser && !userProfile)

  const value: AuthContextType = {
    user: currentUser,
    loading,
    error,
    signOut,
    signUpWithGoogle,
    createUserProfile,
    updateUserProfile,
    refreshUserProfile,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
