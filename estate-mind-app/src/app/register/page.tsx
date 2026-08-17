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
    return "Registration failed. Please try again.";
  }

  const rawMessage = error.message?.trim();

  if (!rawMessage) {
    return "Registration failed. Please try again.";
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
      return "This username is already in use.";
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
      return "This email address is already in use.";
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
      return "This phone number is already in use.";
    }
  }

  if (
    normalized.includes("chỉ được đăng ký") ||
    normalized.includes("customer hoặc seller") ||
    normalized.includes("customer or seller")
  ) {
    return "Please choose either Customer or Seller as your account type.";
  }

  return message || "Registration failed. Please try again.";
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
      nextErrors.lastName = "Please enter your last name.";
    }

    if (!form.firstName.trim()) {
      nextErrors.firstName = "Please enter your first name.";
    }

    if (!form.username.trim()) {
      nextErrors.username = "Please enter a username.";
    }

    if (!form.password.trim()) {
      nextErrors.password = "Please enter a password.";
    } else if (form.password.length < 6) {
      nextErrors.password = "Password must be at least 6 characters.";
    }

    const phone = form.phone.replace(/[\s.-]/g, "");

    if (!phone) {
      nextErrors.phone = "Please enter your phone number.";
    } else if (!/^[0-9]{9,11}$/.test(phone)) {
      nextErrors.phone = "Phone number must contain 9–11 digits.";
    }

    if (!form.email.trim()) {
      nextErrors.email = "Please enter your email address.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      nextErrors.email = "Please enter a valid email address.";
    }

    if (!avatar) {
      nextErrors.avatar = "Please select a profile picture.";
    } else if (!avatar.type.startsWith("image/")) {
      nextErrors.avatar = "The selected file must be an image.";
    } else if (avatar.size > 5 * 1024 * 1024) {
      nextErrors.avatar = "Profile picture must not exceed 5 MB.";
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
          Create Account
        </h1>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {/* NAME */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="lastName"
                className="mb-1 block text-sm text-gray-600"
              >
                Last Name
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
                First Name
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
              Account Type
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
                Buyer / Renter
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
                Seller / Agent
              </button>
            </div>
          </div>

          {/* USERNAME */}
          <div>
            <label
              htmlFor="username"
              className="mb-1 block text-sm text-gray-600"
            >
              Username
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
              Password
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
              Phone Number
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
              Profile Picture *
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
              JPG, PNG or WEBP. Maximum size: 5 MB.
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
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-red-500 hover:underline"
          >
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
