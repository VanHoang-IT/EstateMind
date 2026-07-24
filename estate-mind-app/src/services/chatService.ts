// import { authFetch, throwIfNotOk } from "@/lib/api";

// export interface ChatResponse {
//   answer: string;
//   sessionId: number;
// }

// export const chatService = {
//   async ask(question: string, sessionId?: number): Promise<ChatResponse> {
//     // /api/chat/ask không bắt buộc đăng nhập (xem ApiChatController), authFetch
//     // vẫn dùng được vì chỉ gắn Authorization khi có token, không bắt buộc có.
//     const res = await authFetch("/chat/ask", {
//       method: "POST",
//       body: JSON.stringify({ question, sessionId }),
//     });
//     await throwIfNotOk(res);
//     return res.json();
//   },
// };
import { authFetch, throwIfNotOk } from "@/lib/api";

export interface ChatResponse {
  answer: string;
  sessionId?: number;
}

export const chatService = {
  async ask(
    question: string,
    sessionId?: number,
  ): Promise<ChatResponse> {
    const res = await authFetch("/chat/ask", {
      method: "POST",
      headers: {
        Accept: "application/json",
      },
      body: JSON.stringify({
        question,
        sessionId,
      }),
    });

    if (!res.ok) {
      const errorBody = await res.clone().text();

      console.error("CHAT API ERROR:", {
        status: res.status,
        statusText: res.statusText,
        contentType: res.headers.get("content-type"),
        body: errorBody,
      });
    }

    await throwIfNotOk(res);

    const contentType =
      res.headers.get("content-type") ?? "";

    if (!contentType.includes("application/json")) {
      const body = await res.text();

      console.error("CHAT API KHÔNG TRẢ JSON:", body);

      throw new Error(
        "Chat API không trả về JSON hợp lệ.",
      );
    }

    return res.json();
  },
};