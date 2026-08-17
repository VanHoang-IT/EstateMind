"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { useAuth } from "@/contexts/AuthContext";

type LoginErrors = {
  username?: string;
  password?: string;
};

function getReadableError(error: unknown): string {
  if (!(error instanceof Error)) {
    return "Đăng nhập không thành công. Vui lòng thử lại.";
  }

  const rawMessage = error.message?.trim();

  if (!rawMessage) {
    return "Đăng nhập không thành công. Vui lòng thử lại.";
  }

  let message = rawMessage;

  if (rawMessage.includes("<!doctype html") || rawMessage.includes("<html")) {
    const documentHtml = new DOMParser().parseFromString(
      rawMessage,
      "text/html",
    );

    const paragraphs = Array.from(documentHtml.querySelectorAll("p"));

    const messageParagraph = paragraphs.find(
      (paragraph) =>
        paragraph.querySelector("b")?.textContent?.trim() === "Message",
    );

    message =
      messageParagraph?.textContent?.replace(/^Message\s*/i, "").trim() || "";
  }

  const normalized = message.toLowerCase();

  if (
    normalized.includes("sai tên đăng nhập") ||
    normalized.includes("sai mật khẩu") ||
    normalized.includes("tên đăng nhập hoặc mật khẩu") ||
    normalized.includes("invalid username") ||
    normalized.includes("invalid password") ||
    normalized.includes("bad credentials")
  ) {
    return "Tên đăng nhập hoặc mật khẩu không chính xác.";
  }

  if (
    normalized.includes("tài khoản bị khóa") ||
    normalized.includes("account is locked") ||
    normalized.includes("account locked") ||
    normalized.includes("disabled")
  ) {
    return "Tài khoản này hiện không khả dụng.";
  }

  if (
    normalized.includes("không tìm thấy") ||
    normalized.includes("not found")
  ) {
    return "Tên đăng nhập hoặc mật khẩu không chính xác.";
  }

  return message || "Đăng nhập không thành công. Vui lòng thử lại.";
}

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<LoginErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function validateForm(): boolean {
    const nextErrors: LoginErrors = {};

    if (!username.trim()) {
      nextErrors.username = "Vui lòng nhập tên đăng nhập.";
    }

    if (!password.trim()) {
      nextErrors.password = "Vui lòng nhập mật khẩu.";
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      await login({
        username: username.trim(),
        password,
      });

      router.push("/");
    } catch (caughtError) {
      const message = getReadableError(caughtError);
      const normalized = message.toLowerCase();

      if (
        (normalized.includes("username") ||
          normalized.includes("tên đăng nhập")) &&
        !normalized.includes("password") &&
        !normalized.includes("mật khẩu")
      ) {
        setErrors((current) => ({
          ...current,
          username: message,
        }));
      } else if (
        (normalized.includes("password") || normalized.includes("mật khẩu")) &&
        !normalized.includes("username") &&
        !normalized.includes("tên đăng nhập")
      ) {
        setErrors((current) => ({
          ...current,
          password: message,
        }));
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  }

  const inputClass = (hasError: boolean) =>
    `w-full rounded-md border px-3 py-2 text-sm text-gray-900
     focus:outline-none ${
       hasError
         ? "border-red-500 focus:border-red-500"
         : "border-gray-300 focus:border-red-500"
     }`;

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-md border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="mb-6 text-center text-xl font-bold text-gray-900">
          Đăng nhập
        </h1>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <label
              htmlFor="username"
              className="mb-1 block text-sm text-gray-600"
            >
              Tên đăng nhập
            </label>

            <input
              id="username"
              name="username"
              value={username}
              onChange={(event) => {
                setUsername(event.target.value);

                setErrors((current) => ({
                  ...current,
                  username: undefined,
                }));

                setError(null);
              }}
              autoComplete="username"
              aria-invalid={Boolean(errors.username)}
              className={inputClass(Boolean(errors.username))}
            />

            {errors.username && (
              <p className="mt-1 text-xs text-red-600">{errors.username}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1 block text-sm text-gray-600"
            >
              Mật khẩu
            </label>

            <input
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);

                setErrors((current) => ({
                  ...current,
                  password: undefined,
                }));

                setError(null);
              }}
              autoComplete="current-password"
              aria-invalid={Boolean(errors.password)}
              className={inputClass(Boolean(errors.password))}
            />

            {errors.password && (
              <p className="mt-1 text-xs text-red-600">{errors.password}</p>
            )}
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600"
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-red-500 py-2.5 font-semibold text-white transition-colors hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-500">
          Chưa có tài khoản?{" "}
          <Link
            href="/register"
            className="font-medium text-red-500 hover:underline"
          >
            Tạo tài khoản
          </Link>
        </p>
      </div>
    </div>
  );
}
