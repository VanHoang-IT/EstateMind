import Link from "next/link";
import { Globe2, Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-[#d8ddda] bg-[#e5e7e6]">
      <div className="mx-auto grid max-w-[1180px] gap-10 px-5 py-14 sm:px-6 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <Link
            href="/"
            className="text-2xl font-bold tracking-[-0.03em] text-[#202523]"
          >
            EstateMind
          </Link>

          <p className="mt-4 max-w-[260px] text-sm leading-6 text-[#68736d]">
            Hành trình tìm kiếm không gian sống phù hợp bắt đầu từ đây. Đơn
            giản, hiện đại và thông minh hơn cùng EstateMind.
          </p>

          <div className="mt-5 flex gap-3 text-[#5c6962]">
            <Globe2 size={17} />
            <Mail size={17} />
          </div>
        </div>

        <div>
          <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-[#3d4842]">
            Liên kết nhanh
          </h3>

          <ul className="mt-4 space-y-3 text-sm text-[#5c6962]">
            <li>
              <Link href="/#about" className="hover:text-brand">
                Giới thiệu
              </Link>
            </li>
            <li>
              <Link href="/favorites" className="hover:text-brand">
                Bất động sản đã lưu
              </Link>
            </li>
            <li>
              <Link href="/projects" className="hover:text-brand">
                Bất động sản
              </Link>
            </li>
            <li>
              <Link href="/login" className="hover:text-brand">
                Tài khoản
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-[#3d4842]">
            Loại bất động sản
          </h3>

          <ul className="mt-4 space-y-3 text-sm text-[#5c6962]">
            <li>
              <Link href="/projects" className="hover:text-brand">
                Nhà ở
              </Link>
            </li>
            <li>
              <Link href="/projects" className="hover:text-brand">
                Căn hộ
              </Link>
            </li>
            <li>
              <Link href="/projects" className="hover:text-brand">
                Biệt thự
              </Link>
            </li>
            <li>
              <Link href="/properties/new" className="hover:text-brand">
                Đăng tin mới
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-[#3d4842]">
            Nhận thông tin mới
          </h3>

          <p className="mt-4 text-sm leading-6 text-[#5c6962]">
            Đăng ký để nhận thông tin mới về sản phẩm và bất động sản.
          </p>

          <div className="mt-4 flex gap-2">
            <input
              type="email"
              placeholder="Địa chỉ email"
              aria-label="Địa chỉ email đăng ký nhận tin"
              className="min-w-0 flex-1 rounded-lg border border-[#cfd7d2] bg-white px-3 py-2.5 text-sm outline-none transition focus:border-brand"
            />
            <button
              type="button"
              className="rounded-lg bg-brand px-4 text-sm font-semibold text-white transition hover:bg-brand-hover"
            >
              Đăng ký
            </button>
          </div>
        </div>
      </div>

      <div className="border-t border-[#d4dad6]">
        <div className="mx-auto flex max-w-[1180px] flex-col gap-2 px-5 py-5 text-xs text-[#707b75] sm:px-6 md:flex-row md:items-center md:justify-between">
          <span>© 2026 EstateMind. Đã đăng ký bản quyền.</span>

          <div className="flex gap-5">
            <Link href="#" className="hover:text-brand">
              Chính sách bảo mật
            </Link>
            <Link href="#" className="hover:text-brand">
              Điều khoản sử dụng
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
