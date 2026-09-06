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
export async function throwIfNotOk(res: Response) {
  if (res.ok) return;

  const text = await res.text().catch(() => "");
  const looksLikeHtml = text.trim().startsWith("<");
  const looksLikeStackTrace =
    text.includes("Exception") || text.includes("\tat ");
  let jsonMessage: string | null = null;
  try {
    const json = JSON.parse(text);
    if (typeof json.message === "string") jsonMessage = json.message;
  } catch {}

  if (
    jsonMessage &&
    jsonMessage.length < 200 &&
    !jsonMessage.includes("Exception")
  ) {
    throw new Error(jsonMessage);
  }

  if (!text || looksLikeHtml || looksLikeStackTrace || jsonMessage) {
    throw new Error(
      `Đã có lỗi xảy ra (mã lỗi ${res.status}). Vui lòng thử lại.`,
    );
  }
  throw new Error(text);
}
