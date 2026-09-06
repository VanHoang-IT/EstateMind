"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { useAuth } from "@/contexts/AuthContext";

type RegisterForm = {
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
};

type FieldErrors = Partial<Record<keyof RegisterForm | "avatar", string>>;

const initialForm: RegisterForm = {
  username: "",
  password: "",
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
};

function getReadableError(error: unknown): string {
  if (!(error instanceof Error)) {
    return "Đăng ký thất bại. Vui lòng thử lại.";
  }

  const rawMessage = error.message?.trim();

  if (!rawMessage) {
    return "Đăng ký thất bại. Vui lòng thử lại.";
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

  if (normalized.includes("tên đăng nhập") || normalized.includes("username")) {
    if (
      normalized.includes("tồn tại") ||
      normalized.includes("đã được sử dụng") ||
      normalized.includes("already") ||
      normalized.includes("exists") ||
      normalized.includes("taken")
    ) {
      return "Tên đăng nhập này đã được sử dụng.";
    }
  }

  if (normalized.includes("email")) {
    if (
      normalized.includes("tồn tại") ||
      normalized.includes("đã được sử dụng") ||
      normalized.includes("already") ||
      normalized.includes("exists") ||
      normalized.includes("used")
    ) {
      return "Địa chỉ email này đã được sử dụng.";
    }
  }

  if (normalized.includes("số điện thoại") || normalized.includes("phone")) {
    if (
      normalized.includes("tồn tại") ||
      normalized.includes("đã được sử dụng") ||
      normalized.includes("already") ||
      normalized.includes("exists") ||
      normalized.includes("used")
    ) {
      return "Số điện thoại này đã được sử dụng.";
    }
  }

  if (
    normalized.includes("chỉ được đăng ký") ||
    normalized.includes("customer hoặc seller") ||
    normalized.includes("customer or seller")
  ) {
    return "Vui lòng chọn Khách hàng hoặc Người bán làm loại tài khoản.";
  }

  return message || "Đăng ký thất bại. Vui lòng thử lại.";
}

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState<RegisterForm>(initialForm);

  const [role, setRole] = useState<"CUSTOMER" | "SELLER">("CUSTOMER");

  const [avatar, setAvatar] = useState<File | null>(null);

  const [errors, setErrors] = useState<FieldErrors>({});

  const [error, setError] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);

  function update(key: keyof RegisterForm, value: string) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));

    setErrors((current) => ({
      ...current,
      [key]: undefined,
    }));

    setError(null);
  }

  function validateForm(): boolean {
    const nextErrors: FieldErrors = {};

    if (!form.lastName.trim()) {
      nextErrors.lastName = "Vui lòng nhập họ của bạn.";
    }

    if (!form.firstName.trim()) {
      nextErrors.firstName = "Vui lòng nhập tên của bạn.";
    }

    if (!form.username.trim()) {
      nextErrors.username = "Vui lòng nhập tên đăng nhập.";
    }

    if (!form.password.trim()) {
      nextErrors.password = "Vui lòng nhập mật khẩu.";
    } else if (form.password.length < 6) {
      nextErrors.password = "Mật khẩu phải có ít nhất 6 ký tự.";
    }

    const phone = form.phone.replace(/[\s.-]/g, "");

    if (!phone) {
      nextErrors.phone = "Vui lòng nhập số điện thoại.";
    } else if (!/^[0-9]{9,11}$/.test(phone)) {
      nextErrors.phone = "Số điện thoại phải gồm 9–11 chữ số.";
    }

    if (!form.email.trim()) {
      nextErrors.email = "Vui lòng nhập địa chỉ email.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      nextErrors.email = "Vui lòng nhập địa chỉ email hợp lệ.";
    }

    if (!avatar) {
      nextErrors.avatar = "Vui lòng chọn ảnh đại diện.";
    } else if (!avatar.type.startsWith("image/")) {
      nextErrors.avatar = "Tệp được chọn phải là hình ảnh.";
    } else if (avatar.size > 5 * 1024 * 1024) {
      nextErrors.avatar = "Ảnh đại diện không được vượt quá 5 MB.";
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  }

  function showServerError(message: string) {
    const normalized = message.toLowerCase();

    if (normalized.includes("email")) {
      setErrors((current) => ({
        ...current,
        email: message,
      }));
      return;
    }

    if (normalized.includes("phone") || normalized.includes("số điện thoại")) {
      setErrors((current) => ({
        ...current,
        phone: message,
      }));
      return;
    }

    if (
      normalized.includes("username") ||
      normalized.includes("tên đăng nhập")
    ) {
      setErrors((current) => ({
        ...current,
        username: message,
      }));
      return;
    }

    if (normalized.includes("password") || normalized.includes("mật khẩu")) {
      setErrors((current) => ({
        ...current,
        password: message,
      }));
      return;
    }

    setError(message);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    if (!avatar) {
      return;
    }

    setLoading(true);

    try {
      await register({
        username: form.username.trim(),
        password: form.password,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phone: form.phone.replace(/[\s.-]/g, ""),
        email: form.email.trim(),
        avatar,
        role,
      });

      router.push("/");
    } catch (caughtError) {
      const message = getReadableError(caughtError);

      showServerError(message);
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
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-md border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="mb-6 text-center text-xl font-bold text-gray-900">
          Tạo tài khoản
        </h1>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {/* NAME */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="lastName"
                className="mb-1 block text-sm text-gray-600"
              >
                Họ
              </label>

              <input
                id="lastName"
                name="lastName"
                value={form.lastName}
                onChange={(event) => update("lastName", event.target.value)}
                autoComplete="family-name"
                aria-invalid={Boolean(errors.lastName)}
                className={inputClass(Boolean(errors.lastName))}
              />

              {errors.lastName && (
                <p className="mt-1 text-xs text-red-600">{errors.lastName}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="firstName"
                className="mb-1 block text-sm text-gray-600"
              >
                Tên
              </label>

              <input
                id="firstName"
                name="firstName"
                value={form.firstName}
                onChange={(event) => update("firstName", event.target.value)}
                autoComplete="given-name"
                aria-invalid={Boolean(errors.firstName)}
                className={inputClass(Boolean(errors.firstName))}
              />

              {errors.firstName && (
                <p className="mt-1 text-xs text-red-600">{errors.firstName}</p>
              )}
            </div>
          </div>

          {/* ROLE */}
          <div>
            <label className="mb-1 block text-sm text-gray-600">
              Loại tài khoản
            </label>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole("CUSTOMER")}
                className={`rounded-md border py-2 text-sm font-medium transition-colors ${
                  role === "CUSTOMER"
                    ? "border-red-500 bg-red-50 text-red-600"
                    : "border-gray-300 text-gray-600 hover:border-gray-400"
                }`}
              >
                Người mua / Người thuê
              </button>

              <button
                type="button"
                onClick={() => setRole("SELLER")}
                className={`rounded-md border py-2 text-sm font-medium transition-colors ${
                  role === "SELLER"
                    ? "border-red-500 bg-red-50 text-red-600"
                    : "border-gray-300 text-gray-600 hover:border-gray-400"
                }`}
              >
                Người bán / Môi giới
              </button>
            </div>
          </div>

          {/* USERNAME */}
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
              value={form.username}
              onChange={(event) => update("username", event.target.value)}
              autoComplete="username"
              aria-invalid={Boolean(errors.username)}
              className={inputClass(Boolean(errors.username))}
            />

            {errors.username && (
              <p className="mt-1 text-xs text-red-600">{errors.username}</p>
            )}
          </div>

          {/* PASSWORD */}
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
              value={form.password}
              onChange={(event) => update("password", event.target.value)}
              autoComplete="new-password"
              aria-invalid={Boolean(errors.password)}
              className={inputClass(Boolean(errors.password))}
            />

            {errors.password && (
              <p className="mt-1 text-xs text-red-600">{errors.password}</p>
            )}
          </div>

          {/* PHONE */}
          <div>
            <label htmlFor="phone" className="mb-1 block text-sm text-gray-600">
              Số điện thoại
            </label>

            <input
              id="phone"
              name="phone"
              type="tel"
              inputMode="numeric"
              value={form.phone}
              onChange={(event) => update("phone", event.target.value)}
              autoComplete="tel"
              aria-invalid={Boolean(errors.phone)}
              className={inputClass(Boolean(errors.phone))}
            />

            {errors.phone && (
              <p className="mt-1 text-xs text-red-600">{errors.phone}</p>
            )}
          </div>

          {/* EMAIL */}
          <div>
            <label htmlFor="email" className="mb-1 block text-sm text-gray-600">
              Email
            </label>

            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={(event) => update("email", event.target.value)}
              autoComplete="email"
              aria-invalid={Boolean(errors.email)}
              className={inputClass(Boolean(errors.email))}
            />

            {errors.email && (
              <p className="mt-1 text-xs text-red-600">{errors.email}</p>
            )}
          </div>

          {/* AVATAR */}
          <div>
            <label
              htmlFor="avatar"
              className="mb-1 block text-sm text-gray-600"
            >
              Ảnh đại diện *
            </label>

            <input
              id="avatar"
              name="avatar"
              type="file"
              accept="image/*"
              onChange={(event) => {
                const selectedFile = event.target.files?.[0] || null;

                setAvatar(selectedFile);

                setErrors((current) => ({
                  ...current,
                  avatar: undefined,
                }));

                setError(null);
              }}
              aria-invalid={Boolean(errors.avatar)}
              className="w-full text-sm text-gray-700"
            />

            <p className="mt-1 text-xs text-gray-400">
              JPG, PNG hoặc WEBP. Kích thước tối đa: 5 MB.
            </p>

            {errors.avatar && (
              <p className="mt-1 text-xs text-red-600">{errors.avatar}</p>
            )}
          </div>

          {/* GENERAL ERROR */}
          {error && (
            <div
              role="alert"
              className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600"
            >
              {error}
            </div>
          )}

          {/* SUBMIT */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-red-500 py-2.5 font-semibold text-white transition-colors hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Đang tạo tài khoản..." : "Tạo tài khoản"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-500">
          Đã có tài khoản?{" "}
          <Link
            href="/login"
            className="font-medium text-red-500 hover:underline"
          >
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
}
