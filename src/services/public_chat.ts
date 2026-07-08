import { ApiResponse } from "@/lib/api";

const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || "https://chatbot-proxy.subodhconfluxaa.workers.dev/api/v1";
const API_URL = rawApiUrl.replace(/^['"]|['"]$/g, "");

export interface PublicBot {
  id: string;
  name: string;
  avatar_url: string | null;
  greeting_message: string;
  tone: string;
  extra_config?: Record<string, any> | null;
}

export interface ConversationInitResponse {
  conversation_id: string;
  user_identifier: string;
  welcome_message: string;
}

export interface CitationItem {
  source_id: string;
  source_name: string;
  source_type: string;
  url: string | null;
}

export interface PublicMessage {
  id: string;
  conversation_id: string;
  sender: string;
  content: string;
  citations?: CitationItem[];
  escalation_eligible?: boolean;
  created_at: string;
}

export const publicChatService = {
  async getPublicBot(botId: string): Promise<ApiResponse<PublicBot>> {
    try {
      const response = await fetch(`${API_URL}/public/bots/${botId}`);
      return await response.json();
    } catch (error: unknown) {
      return {
        success: false,
        data: null,
        error: {
          code: "REQUEST_FAILED",
          message: error instanceof Error ? error.message : "Request failed",
          details: error,
        },
      };
    }
  },

  async initializeSession(botId: string, browserInfo?: Record<string, unknown>): Promise<ApiResponse<ConversationInitResponse>> {
    try {
      const response = await fetch(`${API_URL}/public/conversations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ bot_id: botId, browser_info: browserInfo }),
      });
      return await response.json();
    } catch (error: unknown) {
      return {
        success: false,
        data: null,
        error: {
          code: "REQUEST_FAILED",
          message: error instanceof Error ? error.message : "Request failed",
          details: error,
        },
      };
    }
  },

  async sendGuestMessage(conversationId: string, content: string): Promise<ApiResponse<PublicMessage>> {
    try {
      const response = await fetch(`${API_URL}/public/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content }),
      });
      return await response.json();
    } catch (error: unknown) {
      return {
        success: false,
        data: null,
        error: {
          code: "REQUEST_FAILED",
          message: error instanceof Error ? error.message : "Request failed",
          details: error,
        },
      };
    }
  },

  async submitFeedback(
    conversationId: string,
    messageId: string,
    rating: "thumbs_up" | "thumbs_down",
    feedbackText?: string
  ): Promise<ApiResponse<{ feedback_id: string }>> {
    try {
      const response = await fetch(`${API_URL}/public/messages/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversation_id: conversationId,
          message_id: messageId,
          rating,
          feedback_text: feedbackText || null,
        }),
      });
      return await response.json();
    } catch (error: unknown) {
      return {
        success: false,
        data: null,
        error: {
          code: "REQUEST_FAILED",
          message: error instanceof Error ? error.message : "Request failed",
          details: error,
        },
      };
    }
  },
};
