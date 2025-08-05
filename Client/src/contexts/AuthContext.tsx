'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { UserService, type User } from '@/services/userService'
import type { User as SupabaseUser } from '@supabase/supabase-js'

type AuthContextType = {
  // Supabase auth user (contains basic auth info like id, email)
  authUser: SupabaseUser | null
  // Full user profile from your database
  user: User | null
  // Loading states
  authLoading: boolean
  userLoading: boolean
  loading: boolean // Combined loading state
  // Error state
  error: string | null
  // Auth methods
  signOut: () => Promise<void>
  signUpWithGoogle: () => Promise<{ provider: string; url: string; }>
  // User profile methods
  createUserProfile: (userData: Omit<User, 'id' | 'createdAt'>) => Promise<void>
  updateUserProfile: (userData: Partial<User>) => Promise<void>
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
  // Supabase auth state
  const [authUser, setAuthUser] = useState<SupabaseUser | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  
  // User profile state
  const [user, setUser] = useState<User | null>(null)
  const [userLoading, setUserLoading] = useState(false)
  
  // Error state
  const [error, setError] = useState<string | null>(null)
  
  const supabase = createClient()

  // Function to fetch user profile from your users table
  const fetchUserProfile = async (userId: string) => {
    try {
      setUserLoading(true)
      setError(null)
      const profile = await UserService.getUser(userId)
      setUser(profile) // This will be null if user doesn't exist yet
    } catch (err) {
      // If it's a 404 or "user not found" error, that's expected for new users
      // Set user to null but don't set an error
      setUser(null)
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
      setUser(null)
      setUserLoading(false)
    }
  }, [authUser?.id])

  // Auth methods
  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null) // Clear user profile when signing out
  }

  const signUpWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    
    if (error) {
      throw error
    }
    
    return data
  }

  // User profile methods
  const createUserProfile = async (userData: Omit<User, 'id' | 'createdAt'>) => {
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
      setUser(newUser)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create user profile'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setUserLoading(false)
    }
  }

  const updateUserProfile = async (userData: Partial<User>) => {
    if (!authUser?.id || !user) {
      throw new Error('User must be authenticated and have existing profile to update')
    }

    try {
      setUserLoading(true)
      setError(null)
      
      // You'll need to implement updateUser in UserService
      const updatedUser = await UserService.createUser({
        ...user,
        ...userData,
        id: authUser.id,
      })
      
      setUser(updatedUser)
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

  // Combined loading state for convenience
  const loading = authLoading || userLoading

  const value: AuthContextType = {
    authUser,
    user,
    authLoading,
    userLoading,
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
