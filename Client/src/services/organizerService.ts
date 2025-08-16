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

  async uploadFile(competitionId: number, file: File): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      // Ensure fileName is always present
      const fileName = file.name || 'uploaded_file';

      const result = await apiCall(`/organizer/uploadFile/${competitionId}?fileName=${encodeURIComponent(fileName)}`, {
        method: 'POST',
        body: formData,
      });
      return result.file.url || '';
    } catch (error) {
      console.error('Failed to upload file:', error);
      throw new Error('Failed to upload file. Please try again later.');
    }
  }
}