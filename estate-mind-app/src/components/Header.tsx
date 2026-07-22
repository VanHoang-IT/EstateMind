import Link from "next/link";

export default function Header() {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between text-sm">
        
        {/* Khối Logo và Menu Trái */}
        <div className="flex items-center gap-8">
          <Link href="/" className="text-red-500 font-bold text-xl flex items-center gap-1 hover:opacity-90">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 3L2 12h3v8h14v-8h3L12 3zm0 2.8l7 7V20H5v-7.2l7-7z"/>
            </svg>
            Batdongsan
          </Link>
          
          <nav className="hidden md:flex gap-6 font-medium text-gray-700">
            <Link href="#" className="hover:text-red-500 transition-colors">Nhà đất bán</Link>
            <Link href="#" className="hover:text-red-500 transition-colors">Nhà đất cho thuê</Link>
            <Link href="#" className="hover:text-red-500 transition-colors">Dự án</Link>
            <Link href="#" className="hover:text-red-500 transition-colors">Tin tức</Link>
          </nav>
        </div>

        {/* Khối Đăng nhập và Đăng tin */}
        <div className="flex items-center gap-4 text-gray-600 font-medium">
          <Link href="#" className="hover:text-red-500 hidden sm:block transition-colors">Đăng nhập</Link>
          <span className="hidden sm:block text-gray-300">|</span>
          <Link href="#" className="hover:text-red-500 hidden sm:block transition-colors">Đăng ký</Link>
          <button className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md font-semibold transition-colors">
            Đăng tin
          </button>
        </div>

      </div>
    </header>
  );
}