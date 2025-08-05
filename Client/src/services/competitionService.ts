import { apiCall } from '@/lib/api'

// CompetitionsService.ts - Service for managing competitions
export class CompetitionsService {
  // Fetch all competitions
  static async getCompetitions(): Promise<any> {
    return apiCall('/competitions')
  }
}