import { apiCall } from '@/lib/api'

export interface Competition {
  id: number
  title: string
  description: string
  prize_pool?: string
  organizer_id: string
  start_date: string
  end_date: string
  category: string
  status: "upcoming" | "active" | "completed"
  created_at: string
  updated_at: string
  banner_url?: string
  landing_html?: string
  landing_css?: string
  teams: number
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

  // Fetch a single competition by ID
  async getCompetition(id: number): Promise<Competition> {
    try {
      const result = await apiCall(`/competitions/${id}`, {
        method: 'GET',
      }, false);
      return result.competition || result;
    } catch (error) {
      console.error('Failed to fetch competition:', error);
      throw new Error('Failed to fetch competition. Please try again later.');
    }
  },
}