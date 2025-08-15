import { apiCall } from '@/lib/api'

export interface Competition {
  id: number
  title: string
  description: string
  organizer_id: string
  start_date: string
  end_date: string
  category: string
  status: string
  created_at: string
  updated_at: string
}


// CompetitionsService.ts - Service for managing competitions
export const CompetitionsService = {
  // Fetch all competitions
  async getCompetitions(): Promise<Competition[]> {
    try {
      const result = await apiCall('/competitions', {
        method: 'GET',
      }, false);
      return result.competitions || [];
    } catch (error) {
      console.error('Failed to fetch competitions:', error);
      throw new Error('Failed to fetch competitions. Please try again later.');
    }
  },
}