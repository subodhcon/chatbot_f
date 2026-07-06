import { fetchWithAuth, ApiResponse } from "@/lib/api";

export interface AnalyticsSummary {
  active_chatbots: number;
  conversations_24h: number;
  knowledge_docs: number;
  success_rate: string;
  total_sessions: number;
  avg_chat_time: string;
}

export interface BotAnalyticsData {
  total_conversations: number;
  total_messages: number;
  csat: number;
  deflection_rate: number;
  conversation_volume: Array<{ date: string; count: number }>;
}

export const analyticsService = {
  async getAnalyticsSummary(): Promise<ApiResponse<AnalyticsSummary>> {
    return fetchWithAuth<AnalyticsSummary>("/analytics/summary");
  },
  async getBotAnalytics(botId: string, startDate?: string, endDate?: string): Promise<ApiResponse<BotAnalyticsData>> {
    const params = new URLSearchParams();
    if (startDate) params.append("start_date", startDate);
    if (endDate) params.append("end_date", endDate);
    const query = params.toString() ? `?${params.toString()}` : "";
    return fetchWithAuth<BotAnalyticsData>(`/analytics/bots/${botId}${query}`);
  },
  async exportBotData(
    botId: string,
    startDate: string,
    endDate: string
  ): Promise<ApiResponse<{ job_id: string; status: string; download_url: string }>> {
    return fetchWithAuth<{ job_id: string; status: string; download_url: string }>(
      `/analytics/bots/${botId}/export`,
      {
        method: "POST",
        body: JSON.stringify({
          start_date: startDate,
          end_date: endDate,
        }),
      }
    );
  },
};
