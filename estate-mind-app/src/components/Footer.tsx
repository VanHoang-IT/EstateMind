"use client";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 py-12 text-sm mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        
        {/* Cột 1: Thông tin công ty */}
        <div>
          <div className="text-white font-bold text-2xl flex items-center gap-1 mb-4">
            <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 3L2 12h3v8h14v-8h3L12 3zm0 2.8l7 7V20H5v-7.2l7-7z"/>
            </svg>
            Batdongsan
          </div>
          <p className="text-gray-400 mb-4 leading-relaxed">
            Nền tảng công nghệ bất động sản số 1 Việt Nam. Giúp bạn tìm kiếm không gian sống lý tưởng một cách nhanh chóng và tin cậy.
          </p>
        </div>

        {/* Cột 2: Hỗ trợ khách hàng */}
        <div>
          <h4 className="text-white font-semibold mb-4 uppercase tracking-wider">Hỗ trợ khách hàng</h4>
          <ul className="space-y-3">
            <li><Link href="#" className="hover:text-white transition-colors">Về chúng tôi</Link></li>
            <li><Link href="#" className="hover:text-white transition-colors">Báo giá & Hỗ trợ</Link></li>
            <li><Link href="#" className="hover:text-white transition-colors">Câu hỏi thường gặp</Link></li>
            <li><Link href="#" className="hover:text-white transition-colors">Góp ý báo lỗi</Link></li>
          </ul>
        </div>

        {/* Cột 3: Quy định */}
        <div>
          <h4 className="text-white font-semibold mb-4 uppercase tracking-wider">Quy định</h4>
          <ul className="space-y-3">
            <li><Link href="#" className="hover:text-white transition-colors">Quy định đăng tin</Link></li>
            <li><Link href="#" className="hover:text-white transition-colors">Quy chế hoạt động</Link></li>
            <li><Link href="#" className="hover:text-white transition-colors">Điều khoản thỏa thuận</Link></li>
            <li><Link href="#" className="hover:text-white transition-colors">Chính sách bảo mật</Link></li>
          </ul>
        </div>

        {/* Cột 4: Liên hệ */}
        <div>
          <h4 className="text-white font-semibold mb-4 uppercase tracking-wider">Liên hệ</h4>
          <ul className="space-y-3">
            <li className="flex items-center gap-2">
              <span className="text-gray-400">📞 Tổng đài:</span> 
              <span className="text-white font-semibold">1900 1881</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-gray-400">✉️ Email:</span> 
              <span className="text-white">cskh@batdongsan.com.vn</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Dòng bản quyền */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-8 border-t border-gray-800 text-center text-gray-500 text-xs">
        © 2026 Batdongsan.vn. Bản quyền thuộc về Công ty TNHH EstateMind Việt Nam.
      </div>
    </footer>
  );
}