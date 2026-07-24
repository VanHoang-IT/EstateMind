import type { Metadata } from "next";
import {
  Geist,
  Geist_Mono,
} from "next/font/google";

import "./globals.css";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ChatWidget from "@/components/ChatWidget";
import { AuthProvider } from "@/contexts/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const themeScript = `
  (() => {
    try {
      const savedTheme =
        localStorage.getItem("estate-theme");

      const prefersDark =
        window.matchMedia(
          "(prefers-color-scheme: dark)"
        ).matches;

      const isDark =
        savedTheme === "dark" ||
        (!savedTheme && prefersDark);

      document.documentElement.classList.toggle(
        "dark",
        isDark
      );

      document.documentElement.style.colorScheme =
        isDark ? "dark" : "light";
    } catch {
      // Giữ chế độ sáng nếu localStorage không khả dụng.
    }
  })();
`;

export const metadata: Metadata = {
  title: "Batdongsan - Nền tảng BĐS số 1",
  description:
    "Tìm kiếm nhà đất, căn hộ nhanh chóng và chính xác.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: themeScript,
          }}
        />
      </head>

      <body
        className={`
          ${geistSans.variable}
          ${geistMono.variable}
          min-h-screen
          bg-background
          text-foreground
          antialiased
        `}
      >
        <AuthProvider>
          <Header />

          {children}

          <Footer />
          <ChatWidget />
        </AuthProvider>
      </body>
    </html>
  );
}