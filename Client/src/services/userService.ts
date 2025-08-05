// Create a user to manage user-related operations
import { apiCall } from '@/lib/api'

export interface User {
  id: string
  email: string
  name: string
  role: 'competitor' | 'organizer'
  about?: string
  createdAt?: string
}

export class UserService {
  // Create a new user
  static async createUser(data: User): Promise<User> {
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
  }

  // Get user by ID
  static async getUser(userId: string): Promise<User | null> {
    try {
      const result = await apiCall(`/users/${userId}`, {
        method: 'GET',
      })
      
      // Check if user data is valid and complete
      if (result && result.user && result.user.id && result.user.name && result.user.email) {
        return result.user as User
      }
      
      return null
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
  }
}