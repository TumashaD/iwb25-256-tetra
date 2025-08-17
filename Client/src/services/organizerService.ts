import { apiCall } from "@/lib/api";
import { Competition } from "./competitionService";

export const OrganizerService = {
    // Create a new competition
  async createCompetition(data: Partial<Competition>): Promise<Competition> {
    try {
      const result = await apiCall('/organizer/create', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return result.competition || result;
    } catch (error) {
      console.error('Failed to create competition:', error);
      throw new Error('Failed to create competition. Please try again later.');
    }
  },

  // Update an existing competition
  async updateCompetition(id: number, data: Partial<Competition>): Promise<Competition> {
    try {
      const result = await apiCall(`/organizer/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      return result.competition || result;
    } catch (error) {
      console.error('Failed to update competition:', error);
      throw new Error('Failed to update competition. Please try again later.');
    }
  },

  // Delete a competition
  async deleteCompetition(id: number): Promise<void> {
    try {
      await apiCall(`/organizer/${id}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Failed to delete competition:', error);
      throw new Error('Failed to delete competition. Please try again later.');
    }
  },

  // Upload banner for competition
  async uploadBanner(competitionId: number, file: File): Promise<void> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      await apiCall(`/organizer/uploadBanner/${competitionId}`, {
        method: 'POST',
        body: formData,
      });
    } catch (error) {
      console.error('Failed to upload banner:', error);
      throw new Error('Failed to upload banner. Please try again later.');
    }

  },

  async saveLandingPage(competitionId: number, data: any): Promise<void> {
    try {
      await apiCall(`/organizer/saveLandingPage/${competitionId}`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error('Failed to save landing page:', error);
      throw new Error('Failed to save landing page. Please try again later.');
    }
  },

  async getLandingPage(competitionId: number): Promise<any> {
    try {
      const result = await apiCall(`/organizer/getLandingPage/${competitionId}`, {
        method: 'GET',
      });
      return result;
    } catch (error) {
      console.error('Failed to get landing page:', error);
      throw new Error('Failed to get landing page. Please try again later.');
    }
  },

  async uploadAssets(competitionId: number, files: File[]): Promise<JSON> {
    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });
      console.log('Uploading assets:', files);

      const result = await apiCall(`/organizer/uploadAssets/${competitionId}`, {
        method: 'POST',
        body: formData,
      });
      return result;
    } catch (error) {
      console.error('Failed to upload file:', error);
      throw new Error('Failed to upload file. Please try again later.');
    }
  },

  async getAssets(competitionId: number): Promise<JSON> {
    try {
      const result = await apiCall(`/organizer/getAssets/${competitionId}`, {
        method: 'GET',
      });
      return result;
    } catch (error) {
      console.error('Failed to get assets:', error);
      throw new Error('Failed to get assets. Please try again later.');
    }
  },

  async deleteAssets(competitionId: number, assetUrls: string[]): Promise<void> {
    try {
      const response = await apiCall(`/organizer/deleteAssets/${competitionId}`, {
        method: 'DELETE',
        body: JSON.stringify(assetUrls),
      });
      console.log('Delete assets response:', response);
    } catch (error) {
      console.error('Failed to delete assets:', error);
      throw new Error('Failed to delete assets. Please try again later.');
    }
  }
}