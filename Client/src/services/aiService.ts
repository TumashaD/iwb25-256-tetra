import { apiCall } from "@/lib/api";

export type AIRequest = {
  competitionId?: number;
  question: string;
};

export type AIResponse = {
  answer: string;
  timestamp: string;
};

export const aiService = {
  generateResponse: async (request: AIRequest): Promise<AIResponse> => {
    const response = await apiCall("/ai/ask", {
      method: "POST",
      body: JSON.stringify(request),
    });
    console.log(response)
    return response as AIResponse;
  },
};