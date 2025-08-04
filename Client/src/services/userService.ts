// Create a user to manage user-related operations
import { apiCall } from '@/lib/api'

export class UserService {
  // Create a new user profile
  static async createUserProfile(data: any): Promise<any> {
    // return apiCall('/users', {
    //   method: 'POST',
    //   body: JSON.stringify(data),
    // })
    // Simulating API call for demonstration purposes
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id: '12345',
          ...data,
          createdAt: new Date().toISOString(),
        })
      }, 1000)
    })
  }
}