// Create a user to manage user-related operations
import { apiCall } from '@/lib/api'

export interface Profile {
  id: string
  email: string
  name: string
  role: 'competitor' | 'organizer'
  avatar_url: string
  readme?: string
  createdAt?: string
}

// Backend User type that matches Ballerina service
interface User {
  id: string
  name: string
  email: string
  role: string
  readme?: string
  created_at?: string
}

export const UserService = {
  // Create a new user
  async createUser(data: Profile): Promise<Profile> {
    try {
      console.log('UserService.createUser called with data:', data)

      // Validate required fields on client side
      if (!data.name?.trim()) {
        throw new Error('Name is required')
      }
      if (!data.email?.trim()) {
        throw new Error('Email is required')
      }
      if (!data.role) {
        throw new Error('Role is required')
      }

      const result = await apiCall('/users/create', {
        method: 'POST',
        body: JSON.stringify(data),
      })

      console.log('UserService.createUser API response:', result)

      // Handle Ballerina API response structure { user: User, message: string, timestamp: string }
      return result.user || result
    } catch (error) {
      console.error('Failed to create user:', error)

      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('already exists') || error.message.includes('duplicate')) {
          throw new Error('An account with this email already exists')
        }
        if (error.message.includes('validation') || error.message.includes('invalid')) {
          throw new Error('Please check your information and try again')
        }
        if (error.message.includes('network') || error.message.includes('fetch')) {
          throw new Error('Network error. Please check your connection and try again')
        }
        throw error
      }

      throw new Error('Failed to create user profile. Please try again.')
    }
  },

  // Get user by ID
  async getUser(userId: string): Promise<Profile | null> {
    try {
      const result = await apiCall(`/users/${userId}`, {
        method: 'GET',
      }) as Profile

      return result
    } catch (error) {
      // If it's a 404 (user not found), return null instead of throwing
      if (error instanceof Error && (
        error.message.includes('404') ||
        error.message.includes('Not Found') ||
        (error as any).status === 404
      )) {
        return null
      }

      console.error('Failed to get user:', error)
      throw error
    }
  },

  async updateUser(userId: string, data: Partial<Profile>): Promise<Profile> {
    try {
      const result = await apiCall(`/users/update/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      })

      return result
    } catch (error) {
      console.error('Failed to update user:', error)
      throw error
    }
  },

  // Search users by email or name
  async searchUsers(query: string): Promise<Profile[]> {
    try {
      if (!query?.trim()) {
        return []
      }

      const result = await apiCall(`/users/search?query=${encodeURIComponent(query)}`, {
        method: 'GET',
      }) as Profile[]

      // Convert User to Profile format
      return result.map(user => ({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role as 'competitor' | 'organizer',
        avatar_url: user.avatar_url || '',
        readme: user.readme,
        createdAt: user.createdAt
      }))
    } catch (error) {
      console.error('Failed to search users:', error)
      return []
    }
  }
}