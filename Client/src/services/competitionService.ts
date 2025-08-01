import { apiCall } from '@/lib/api'

// CompetitionsService.ts - Service for managing competitions
export class CompetitionsService {
  // Fetch all competitions
  static async getCompetitions(): Promise<any> {
    return apiCall('/competitions')
  }

//   // Fetch a specific competition by ID
//   static async getCompetition(id: string): Promise<any> {
//     return apiCall(`/competitions/${id}`)
//   }

//   // Create a new competition
//   static async createCompetition(data: any): Promise<any> {
//     return apiCall('/competitions', {
//       method: 'POST',
//       body: JSON.stringify(data),
//     })
//   }

//   // Update an existing competition
//   static async updateCompetition(id: string, data: any): Promise<any> {
//     return apiCall(`/competitions/${id}`, {
//       method: 'PUT',
//       body: JSON.stringify(data),
//     })
//   }

//   // Delete a competition
//   static async deleteCompetition(id: string): Promise<any> {
//     return apiCall(`/competitions/${id}`, {
//       method: 'DELETE',
//     })
//   }
}