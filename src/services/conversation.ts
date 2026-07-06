import { fetchWithAuth, ApiResponse } from "@/lib/api";

export interface Conversation {
  id: string;
  bot_id: string;
  bot_name: string | null;
  user_identifier: string;
  created_at: string;
  updated_at: string;
  messages_count: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export const conversationService = {
  async getConversations(botId?: string, skip = 0, limit = 50): Promise<ApiResponse<Conversation[]>> {
    const params = new URLSearchParams({
      skip: skip.toString(),
      limit: limit.toString(),
    });
    if (botId) {
      params.append("bot_id", botId);
    }
    return fetchWithAuth<Conversation[]>(`/conversations?${params.toString()}`);
  },

  async getConversationMessages(conversationId: string): Promise<ApiResponse<Message[]>> {
    return fetchWithAuth<Message[]>(`/conversations/${conversationId}/messages`);
  },
};
