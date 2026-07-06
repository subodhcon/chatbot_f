import { fetchWithAuth, ApiResponse } from "@/lib/api";

export interface BotConfig {
  id: string;
  bot_id: string;
  system_prompt: string | null;
  welcome_message: string | null;
  model_name: string;
  temperature: number;
  max_tokens: number;
  top_k: number;
  similarity_threshold: number;
  is_streaming: boolean;
  fallback_message: string | null;
  tone: string | null;
  extra_config: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export interface Bot {
  id: string;
  name: string;
  slug: string;
  avatar_url: string | null;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface BotCreateInput {
  name: string;
  avatar_url?: string | null;
  is_active?: boolean;
}

export interface BotUpdateInput {
  name?: string;
  avatar_url?: string | null;
  is_active?: boolean;
}

export interface BotDeleteConfirmInput {
  confirm_name: string;
}

export interface BotConfigUpdateInput {
  greeting_message?: string | null;
  fallback_message?: string | null;
  tone?: string | null;
  extra_config?: Record<string, any> | null;
}

/**
 * Service for interacting with backend Bot endpoints.
 */
export const botService = {
  /**
   * Fetch paginated list of bots.
   */
  async getBots(skip = 0, limit = 100, activeOnly = false): Promise<ApiResponse<Bot[]>> {
    const params = new URLSearchParams({
      skip: skip.toString(),
      limit: limit.toString(),
      active_only: activeOnly.toString(),
    });
    return fetchWithAuth<Bot[]>(`/bots?${params.toString()}`);
  },

  /**
   * Fetch single bot by ID.
   */
  async getBot(botId: string): Promise<ApiResponse<Bot>> {
    return fetchWithAuth<Bot>(`/bots/${botId}`);
  },

  /**
   * Create a new bot.
   */
  async createBot(input: BotCreateInput): Promise<ApiResponse<Bot>> {
    return fetchWithAuth<Bot>("/bots", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  /**
   * Partially update a bot (name, avatar, status).
   */
  async updateBot(botId: string, input: BotUpdateInput): Promise<ApiResponse<Bot>> {
    return fetchWithAuth<Bot>(`/bots/${botId}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  },

  /**
   * Hard delete a bot.
   */
  async deleteBot(botId: string, confirmName: string): Promise<ApiResponse<{ id: string; deleted: boolean; name: string }>> {
    return fetchWithAuth<{ id: string; deleted: boolean; name: string }>(`/bots/${botId}`, {
      method: "DELETE",
      body: JSON.stringify({ confirm_name: confirmName }),
    });
  },

  /**
   * Fetch the configuration for a bot.
   */
  async getBotConfig(botId: string): Promise<ApiResponse<BotConfig>> {
    return fetchWithAuth<BotConfig>(`/bots/${botId}/config`);
  },

  /**
   * Update the configuration for a bot.
   */
  async updateBotConfig(botId: string, input: BotConfigUpdateInput): Promise<ApiResponse<{ config: BotConfig }>> {
    return fetchWithAuth<{ config: BotConfig }>(`/bots/${botId}/config`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  },

  /**
   * Fetch historical version snapshots for a bot.
   */
  async getBotVersions(
    botId: string,
    skip = 0,
    limit = 30
  ): Promise<ApiResponse<{ bot_id: string; total_returned: number; skip: number; limit: number; versions: BotVersion[] }>> {
    const params = new URLSearchParams({
      skip: skip.toString(),
      limit: limit.toString(),
    });
    return fetchWithAuth<{ bot_id: string; total_returned: number; skip: number; limit: number; versions: BotVersion[] }>(
      `/bots/${botId}/versions?${params.toString()}`
    );
  },

  /**
   * Restore the live configuration to a historical version.
   */
  async restoreBotVersion(botId: string, versionId: string): Promise<ApiResponse<unknown>> {
    return fetchWithAuth<unknown>(`/bots/${botId}/versions/${versionId}/restore`, {
      method: "POST",
    });
  },

  /**
   * Uploads an avatar image file and tracks progress.
   */
  uploadAvatar(
    file: File,
    onProgress: (pct: number) => void
  ): Promise<ApiResponse<{ avatar_url: string }>> {
    return new Promise((resolve) => {
      const xhr = new XMLHttpRequest();
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
      const accessToken = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

      xhr.open("POST", `${API_URL}/bots/avatar/upload`);
      
      if (accessToken) {
        xhr.setRequestHeader("Authorization", `Bearer ${accessToken}`);
      }

      // Track progress
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

  /**
   * Uploads a knowledge base document (PDF or DOCX) for a specific bot and tracks progress.
   */
  uploadKnowledge(
    botId: string,
    file: File,
    onProgress: (pct: number) => void
  ): Promise<ApiResponse<KnowledgeUploadResponseData>> {
    return new Promise((resolve) => {
      const xhr = new XMLHttpRequest();
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
      const accessToken = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

      xhr.open("POST", `${API_URL}/bots/${botId}/knowledge/upload`);
      
      if (accessToken) {
        xhr.setRequestHeader("Authorization", `Bearer ${accessToken}`);
      }

      // Track progress
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

  /**
   * Starts a URL crawl job for a specific bot.
   */
  async crawlUrl(botId: string, url: string, depth: number): Promise<ApiResponse<UrlCrawlResponse>> {
    return fetchWithAuth<UrlCrawlResponse>(`/bots/${botId}/knowledge/crawl`, {
      method: "POST",
      body: JSON.stringify({ url, depth }),
    });
  },

  /**
   * Fetch list of knowledge sources for a specific bot with pagination.
   */
  async getBotKnowledge(
    botId: string,
    skip = 0,
    limit = 10
  ): Promise<ApiResponse<{ total: number; skip: number; limit: number; items: KnowledgeSource[] }>> {
    const params = new URLSearchParams({
      skip: skip.toString(),
      limit: limit.toString(),
    });
    return fetchWithAuth<{ total: number; skip: number; limit: number; items: KnowledgeSource[] }>(
      `/bots/${botId}/knowledge?${params.toString()}`
    );
  },

  /**
   * Bulk deletes specified knowledge sources for a bot.
   */
  async bulkDeleteKnowledge(botId: string, sourceIds: string[]): Promise<ApiResponse<{ deleted_count: number; source_ids: string[] }>> {
    return fetchWithAuth<{ deleted_count: number; source_ids: string[] }>(`/bots/${botId}/knowledge/bulk-delete`, {
      method: "POST",
      body: JSON.stringify({ source_ids: sourceIds }),
    });
  },
};

export interface UrlCrawlResponse {
  id: string;
  bot_id: string;
  start_url: string;
  crawl_depth: number;
  status: string;
  created_at: string;
}

export interface BotVersion {
  id: string;
  bot_id: string;
  version_number: number;
  snapshot_json: {
    welcome_message?: string;
    fallback_message?: string;
    tone?: string;
    [key: string]: unknown;
  };
  created_at: string;
}

export interface KnowledgeSource {
  id: string;
  bot_id: string;
  source_type: 'pdf' | 'docx' | 'url';
  source_name: string;
  file_path: string | null;
  url: string | null;
  file_size: number | null;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  created_at: string;
  progress?: number;
  error_message?: string | null;
}

export interface IngestionJob {
  id: string;
  source_id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
}

export interface KnowledgeUploadResponseData {
  knowledge_source: KnowledgeSource;
  ingestion_job: IngestionJob;
}

