import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

// 1. Import Header và Footer vào
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// 2. Chỉnh sửa lại tiêu đề trang web cho chuyên nghiệp
export const metadata: Metadata = {
  title: "Batdongsan - Nền tảng BĐS số 1",
  description: "Tìm kiếm nhà đất, căn hộ nhanh chóng và chính xác.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi" // 3. Nên đổi thành 'vi' vì web của bạn là tiếng Việt
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* Lắp Header lên đầu */}
        <Header />
        
        {/* Bọc children bằng main + flex-grow để tự động đẩy Footer xuống dưới đáy màn hình */}
        <main className="flex-grow">
          {children}
        </main>
        
        {/* Lắp Footer xuống cuối */}
        <Footer />
      </body>
    </html>
  );
}