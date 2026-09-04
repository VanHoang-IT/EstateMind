// Đọc từ biến môi trường, có fallback về giá trị cũ đang hardcode trong repo
// (bao gồm luôn context path "/EstateMind" của app Spring Boot deploy dạng WAR).
// Phía server (SSR/route handlers) ưu tiên API_INTERNAL_URL vì trong Docker,
// "localhost" ở NEXT_PUBLIC_API_URL trỏ vào chính container frontend chứ
// không phải backend — chỉ trình duyệt (client) mới gọi được localhost đó.
export const API_URL =
  (typeof window === "undefined" && process.env.API_INTERNAL_URL) ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8080/EstateMind/api";

const TOKEN_KEY = "estatemind_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
}

/**
 * fetch() có tự động gắn header Authorization: Bearer <token> nếu đã đăng nhập.
 * Dùng cho mọi lời gọi tới /api/secure/** (tạo/sửa/xoá property, review, ...).
 */
export async function authFetch(path: string, options: RequestInit = {}) {
  const token = getToken();
  const headers = new Headers(options.headers);

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    cache: "no-store",
  });
}

/**
 * Ném lỗi có message rõ ràng từ response của backend (backend trả string hoặc
 * JSON tuỳ endpoint — ApiPropertyController/ApiReviewController trả text thô
 * kiểu `e.getMessage()`, không phải JSON, nên phải thử đọc text trước).
 */
export async function throwIfNotOk(res: Response) {
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Lỗi ${res.status}`);
  }
}
