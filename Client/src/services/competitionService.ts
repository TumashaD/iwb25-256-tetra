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
  banner_url? : string
  created_at: string
  updated_at: string
}


// CompetitionsService.ts - Service for managing competitions
export class CompetitionsService {
  // Fetch all competitions
  static async getCompetitions(): Promise<Competition[]> {
    try {
      const result = await apiCall('/competitions', {
        method: 'GET',
      }, false);
      return result.competitions || [];
    } catch (error) {
      console.error('Failed to fetch competitions:', error);
      throw new Error('Failed to fetch competitions. Please try again later.');
    }
  }

  // Create a new competition
  static async createCompetition(data: Partial<Competition>): Promise<Competition> {
    try {
      const result = await apiCall('/competitions/create', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return result.competition || result;
    } catch (error) {
      console.error('Failed to create competition:', error);
      throw new Error('Failed to create competition. Please try again later.');
    }
  }

  // Update an existing competition
  static async updateCompetition(id: number, data: Partial<Competition>): Promise<Competition> {
    try {
      const result = await apiCall(`/competitions/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      return result.competition || result;
    } catch (error) {
      console.error('Failed to update competition:', error);
      throw new Error('Failed to update competition. Please try again later.');
    }
  }

  // Delete a competition
  static async deleteCompetition(id: number): Promise<void> {
    try {
      await apiCall(`/competitions/${id}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Failed to delete competition:', error);
      throw new Error('Failed to delete competition. Please try again later.');
    }
  }

  // Upload banner for competition
  static async uploadBanner(competitionId: number, file: File): Promise<void> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      await apiCall(`/competitions/uploadBanner/${competitionId}`, {
        method: 'POST',
        body: formData,
      });
    } catch (error) {
      console.error('Failed to upload banner:', error);
      throw new Error('Failed to upload banner. Please try again later.');
    }

  }

  // Get banner URL for competition
   static getBannerUrl(competitionId: number): string {
    return `${process.env.NEXT_PUBLIC_API_URL}/competitions/getBanner/${competitionId}`;
  }
}