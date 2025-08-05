'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from './SupabaseAuthContext'
import { UserService, type User } from '@/services/userService'

type UserContextType = {
  userProfile: User | null
  loading: boolean
  error: string | null
  createUserProfile: (userData: Omit<User, 'id' | 'createdAt'>) => Promise<void>
  updateUserProfile: (userData: Partial<User>) => Promise<void>
  refreshUserProfile: () => Promise<void>
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export const useUser = () => {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const { user: authUser } = useAuth()
  const [userProfile, setUserProfile] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Function to fetch user profile from your users table
  const fetchUserProfile = async (userId: string) => {
    try {
      setLoading(true)
      setError(null)
      const profile = await UserService.getUser(userId)
      setUserProfile(profile) // This will be null if user doesn't exist yet
    } catch (err) {
      // If it's a 404 or "user not found" error, that's expected for new users
      // Set userProfile to null but don't set an error
      console.log('User profile not found (expected for new users):', err)
      setUserProfile(null)
      // Only set error for actual API/network failures
      if (err instanceof Error && !err.message.includes('not found') && !err.message.includes('404')) {
        setError(err.message)
      }
    } finally {
      setLoading(false)
    }
  }

  // Effect to fetch user profile when auth user changes
  useEffect(() => {
    if (authUser?.id) {
      fetchUserProfile(authUser.id)
    } else {
      setUserProfile(null)
      setLoading(false)
    }
  }, [authUser?.id])

  const createUserProfile = async (userData: Omit<User, 'id' | 'createdAt'>) => {
    if (!authUser?.id) {
      throw new Error('User must be authenticated to create profile')
    }

    // Prevent duplicate requests
    if (loading) {
      console.warn('User profile creation already in progress')
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const userDataToSend = {
        ...userData,
        id: authUser.id,
        email: authUser.email || userData.email,
      }
      
      console.log('Creating user profile with data:', userDataToSend)
      
      const response = await UserService.createUser(userDataToSend)
      
      // Handle the Ballerina API response structure which returns { user: User, message: string, timestamp: string }
      const newUser = (response as any).user || response
      setUserProfile(newUser)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create user profile'
      setError(errorMessage)
      console.error('Error creating user profile:', err)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const updateUserProfile = async (userData: Partial<User>) => {
    if (!authUser?.id || !userProfile) {
      throw new Error('User must be authenticated and have existing profile to update')
    }

    try {
      setLoading(true)
      setError(null)
      
      // You'll need to implement updateUser in UserService
      const updatedUser = await UserService.createUser({
        ...userProfile,
        ...userData,
        id: authUser.id,
      })
      
      setUserProfile(updatedUser)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update user profile'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const refreshUserProfile = async () => {
    if (authUser?.id) {
      await fetchUserProfile(authUser.id)
    }
  }

  const value: UserContextType = {
    userProfile,
    loading,
    error,
    createUserProfile,
    updateUserProfile,
    refreshUserProfile,
  }

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  )
}
