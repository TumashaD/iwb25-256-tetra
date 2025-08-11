import { apiCall } from "@/lib/api";

export interface UploadFile {
    file: File;
    bucket: string;
    name: string;
}

export class StorageService {
    // Upload a file to the storage service
    static async uploadFile(data: UploadFile): Promise<string> {
        try {
            console.log('StorageService.uploadFile called with data:', data);
            
            // Validate required fields on client side
            if (!data.file) {
                throw new Error('File is required');
            }
            if (!data.bucket?.trim()) {
                throw new Error('Bucket name is required');
            }
            if (!data.name?.trim()) {
                throw new Error('File name is required');
            }
            
            const formData = new FormData();
            formData.append('file', data.file);
            formData.append('bucket', data.bucket);
            formData.append('name', data.name);
            
            const result = await apiCall('/storage/upload', {
                method: 'POST',
                body: formData,
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            
            console.log('StorageService.uploadFile API response:', result);
            
            // Handle Ballerina API response structure { url: string, message: string, timestamp: string }
            return result.url || result;
        } catch (error) {
            console.error('Failed to upload file:', error);
            
            // Provide more specific error messages
            if (error instanceof Error) {
                if (error.message.includes('network') || error.message.includes('fetch')) {
                    throw new Error('Network error. Please check your connection and try again');
                }
                throw error;
            }
            
            throw new Error('Failed to upload file. Please try again.');
        }
    }
}