import { fetchWithAuth, ApiResponse } from "@/lib/api";

export interface Document {
  id: string;
  filename: string;
  file_size: number;
  created_at: string;
}

export const documentService = {
  async getDocuments(): Promise<ApiResponse<Document[]>> {
    return fetchWithAuth<Document[]>("/documents");
  },

  async deleteDocument(documentId: string): Promise<ApiResponse<{ id: string; deleted: boolean }>> {
    return fetchWithAuth<{ id: string; deleted: boolean }>(`/documents/${documentId}`, {
      method: "DELETE",
    });
  },

  uploadDocument(
    file: File,
    onProgress: (pct: number) => void
  ): Promise<ApiResponse<Document>> {
    return new Promise((resolve) => {
      const xhr = new XMLHttpRequest();
      const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
      const API_URL = rawApiUrl.replace(/^['"]|['"]$/g, "").trim();
      const accessToken = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

      xhr.open("POST", `${API_URL}/documents/upload`);
      
      if (accessToken) {
        xhr.setRequestHeader("Authorization", `Bearer ${accessToken}`);
      }

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const pct = Math.round((event.loaded / event.total) * 100);
          onProgress(pct);
        }
      };

      xhr.onload = () => {
        try {
          if (xhr.status >= 200 && xhr.status < 300) {
            const res = JSON.parse(xhr.responseText);
            resolve(res);
          } else {
            const errorRes = JSON.parse(xhr.responseText);
            resolve({
              success: false,
              data: null,
              error: {
                code: errorRes.error?.code || "UPLOAD_FAILED",
                message: errorRes.error?.message || "Upload failed.",
                details: errorRes.error?.details || null,
              },
            });
          }
        } catch (err: unknown) {
          resolve({
            success: false,
            data: null,
            error: {
              code: "PARSE_ERROR",
              message: "Failed to parse upload response.",
              details: err,
            },
          });
        }
      };

      xhr.onerror = () => {
        resolve({
          success: false,
          data: null,
          error: {
            code: "NETWORK_ERROR",
            message: "A network error occurred during file upload.",
            details: null,
          },
        });
      };

      const formData = new FormData();
      formData.append("file", file);
      xhr.send(formData);
    });
  },
};
