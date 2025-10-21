import { apiClient } from "./api";

export interface UploadedFile {
  filename: string;
  originalname: string;
  mimetype: string;
  size: number;
  url: string;
  path: string;
}

export interface UploadResponse {
  success: boolean;
  data?: UploadedFile;
  message?: string;
}

class FileService {
  /**
   * Upload a single file
   */
  async uploadFile(file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append("file", file);

    // Don't pass headers - apiClient will handle them correctly for FormData
    const response = await apiClient.post<UploadResponse>(
      "/files/upload",
      formData
    );

    return response;
  }

  /**
   * Get file URL
   */
  getFileUrl(filename: string): string {
    // Automatische Backend-URL Erkennung
    let baseUrl = import.meta.env.VITE_API_URL;
    
    if (!baseUrl) {
      const currentHost = window.location.hostname;
      if (currentHost !== 'localhost' && currentHost !== '127.0.0.1') {
        baseUrl = `http://${currentHost}:3000`;
      } else {
        baseUrl = "http://localhost:3000";
      }
    }
    
    return `${baseUrl}/uploads/${filename}`;
  }

  /**
   * Delete a file
   */
  async deleteFile(filename: string): Promise<{ success: boolean; message?: string }> {
    const response = await apiClient.delete<{ success: boolean; message?: string }>(
      `/files/${filename}`
    );

    return response;
  }
}

export const fileService = new FileService();
