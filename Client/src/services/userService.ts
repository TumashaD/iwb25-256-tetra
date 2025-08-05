// Create a user to manage user-related operations
import { apiCall } from '@/lib/api'

export class UserService {
  // Create a new user profile
  static async createUserProfile(data: any): Promise<any> {
    return apiCall('/users/create', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }
}