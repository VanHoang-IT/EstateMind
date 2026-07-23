import { authFetch, throwIfNotOk } from "@/lib/api";

export interface ChatResponse {
  answer: string;
  sessionId: number;
}

export const chatService = {
  async ask(question: string, sessionId?: number): Promise<ChatResponse> {
    // /api/chat/ask không bắt buộc đăng nhập (xem ApiChatController), authFetch
    // vẫn dùng được vì chỉ gắn Authorization khi có token, không bắt buộc có.
    const res = await authFetch("/chat/ask", {
      method: "POST",
      body: JSON.stringify({ question, sessionId }),
    });
    await throwIfNotOk(res);
    return res.json();
  },
};
