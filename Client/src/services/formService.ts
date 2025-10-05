import { apiCall } from '@/lib/api'

export interface Form {
  id: number
  title: string
  description?: string
  competition_id: number
  event_id?: number
  form_schema: any
  status: "draft" | "active" | "closed"
  created_at: string
  updated_at: string
  organizer_id: string
  responses_count?: number
}

export interface FormResponse {
  id: number
  form_id: number
  user_id?: string
  response_data: any
  submitted_at: string
  files?: FormFile[]
}

export interface FormFile {
  id: number
  form_response_id: number
  original_name: string
  file_path: string
  file_size: number
  mime_type: string
  uploaded_at: string
}

export interface CreateFormRequest {
  title: string
  description?: string
  competition_id: number
  event_id?: number
  form_schema: any
  status?: "draft" | "active"
}

export interface SubmitFormRequest {
  form_id: number
  response_data: any
  files?: File[]
}

// FormsService - Service for managing forms and responses
export const FormsService = {
  // Create a new form
  async createForm(formData: CreateFormRequest): Promise<Form> {
    try {
      const result = await apiCall('/forms', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      return result.form || result;
    } catch (error) {
      console.error('Failed to create form:', error);
      throw new Error('Failed to create form. Please try again later.');
    }
  },

  // Get all forms for a competition
  async getCompetitionForms(competitionId: number): Promise<Form[]> {
    try {
      const result = await apiCall(`/competitions/${competitionId}/forms`, {
        method: 'GET',
      }, false);
      return result.forms || [];
    } catch (error) {
      console.error('Failed to fetch forms:', error);
      throw new Error('Failed to fetch forms. Please try again later.');
    }
  },

  // Get a specific form by ID
  async getForm(formId: number): Promise<Form> {
    try {
      const result = await apiCall(`/forms/${formId}`, {
        method: 'GET',
      }, false);
      return result.form || result;
    } catch (error) {
      console.error('Failed to fetch form:', error);
      throw new Error('Failed to fetch form. Please try again later.');
    }
  },

  // Update a form
  async updateForm(formId: number, updates: Partial<CreateFormRequest>): Promise<Form> {
    try {
      const result = await apiCall(`/forms/${formId}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      return result.form || result;
    } catch (error) {
      console.error('Failed to update form:', error);
      throw new Error('Failed to update form. Please try again later.');
    }
  },

  // Delete a form
  async deleteForm(formId: number): Promise<void> {
    try {
      await apiCall(`/forms/${formId}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Failed to delete form:', error);
      throw new Error('Failed to delete form. Please try again later.');
    }
  },

  // Submit a form response
  async submitFormResponse(formId: number, responseData: any, files?: File[]): Promise<FormResponse> {
    try {
      let result;
      
      if (files && files.length > 0) {
        // If there are files, use FormData
        const formData = new FormData();
        formData.append('response_data', JSON.stringify(responseData));
        files.forEach((file, index) => {
          formData.append(`file_${index}`, file);
        });

        result = await apiCall(`/forms/${formId}/responses`, {
          method: 'POST',
          body: formData,
        });
      } else {
        // Regular JSON submission
        result = await apiCall(`/forms/${formId}/responses`, {
          method: 'POST',
          body: JSON.stringify({ response_data: responseData }),
        });
      }
      
      return result.response || result;
    } catch (error) {
      console.error('Failed to submit form response:', error);
      throw new Error('Failed to submit form response. Please try again later.');
    }
  },

  // Get form responses (for organizers)
  async getFormResponses(formId: number): Promise<FormResponse[]> {
    try {
      const result = await apiCall(`/forms/${formId}/responses`, {
        method: 'GET',
      });
      return result.responses || [];
    } catch (error) {
      console.error('Failed to fetch form responses:', error);
      throw new Error('Failed to fetch form responses. Please try again later.');
    }
  },

  // Get user's response to a specific form
  async getUserFormResponse(formId: number): Promise<FormResponse | null> {
    try {
      const result = await apiCall(`/forms/${formId}/responses/me`, {
        method: 'GET',
      });
      return result.response || null;
    } catch (error) {
      console.error('Failed to fetch user form response:', error);
      return null;
    }
  },

  // Upload files for a form
  async uploadFiles(formId: number, files: File[]): Promise<FormFile[]> {
    try {
      const formData = new FormData();
      files.forEach((file, index) => {
        formData.append(`file_${index}`, file);
      });

      const result = await apiCall(`/forms/${formId}/upload`, {
        method: 'POST',
        body: formData,
      });
      
      return result.files || [];
    } catch (error) {
      console.error('Failed to upload files:', error);
      throw new Error('Failed to upload files. Please try again later.');
    }
  },

  // Download a file
  async downloadFile(fileId: number): Promise<Blob> {
    try {
      const response = await fetch(`/api/forms/files/${fileId}`, {
        method: 'GET',
      });
      
      if (!response.ok) {
        throw new Error('Failed to download file');
      }
      
      return response.blob();
    } catch (error) {
      console.error('Failed to download file:', error);
      throw new Error('Failed to download file. Please try again later.');
    }
  },

  // Get form analytics (for organizers)
  async getFormAnalytics(formId: number): Promise<any> {
    try {
      const result = await apiCall(`/forms/${formId}/analytics`, {
        method: 'GET',
      });
      return result.analytics || {};
    } catch (error) {
      console.error('Failed to fetch form analytics:', error);
      throw new Error('Failed to fetch form analytics. Please try again later.');
    }
  },

  // Bulk export form responses
  async exportFormResponses(formId: number, format: 'csv' | 'json' = 'csv'): Promise<Blob> {
    try {
      const response = await fetch(`/api/forms/${formId}/export?format=${format}`, {
        method: 'GET',
      });
      
      if (!response.ok) {
        throw new Error('Failed to export responses');
      }
      
      return response.blob();
    } catch (error) {
      console.error('Failed to export form responses:', error);
      throw new Error('Failed to export form responses. Please try again later.');
    }
  }
}