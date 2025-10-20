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
    return `${import.meta.env.VITE_API_URL || "http://localhost:3000"}/uploads/${filename}`;
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
