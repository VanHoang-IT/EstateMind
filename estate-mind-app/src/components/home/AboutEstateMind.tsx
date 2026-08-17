import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface Props {
  propertyCount?: number;
}

export default function AboutEstateMind({ propertyCount }: Props) {
  return (
    <section id="about" className="scroll-mt-24">
      <div className="mx-auto max-w-[1180px] px-5 pb-16 sm:px-6 lg:pb-20">
        <div className="grid gap-10 overflow-hidden rounded-2xl bg-[#eef0ef] p-7 md:grid-cols-[1.05fr_.95fr] md:p-10 lg:p-12">
          <div className="flex flex-col justify-center">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand">
              Về EstateMind
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-[-0.04em] text-[#202523] lg:text-4xl">
              Định nghĩa lại cách tìm kiếm bất động sản
            </h2>

            <p className="mt-5 max-w-xl text-sm leading-6 text-[#657069]">
              EstateMind kết hợp trải nghiệm tìm kiếm trực quan với công nghệ
              thông minh, giúp bạn khám phá bất động sản nhanh hơn, tập trung
              hơn và dễ dàng tìm được lựa chọn phù hợp với nhu cầu.
            </p>

            <div className="mt-7 grid max-w-lg grid-cols-2 gap-4">
              <div className="rounded-xl bg-white p-4 shadow-[0_8px_30px_rgba(30,50,40,0.05)]">
                <p className="text-2xl font-bold text-brand">
                  {propertyCount != null
                    ? propertyCount.toLocaleString("vi-VN")
                    : "—"}
                </p>
                <p className="mt-1 text-xs text-[#737e78]">
                  Tin đăng đã thu thập
                </p>
              </div>

              <div className="rounded-xl bg-white p-4 shadow-[0_8px_30px_rgba(30,50,40,0.05)]">
                <p className="text-2xl font-bold text-brand">3</p>
                <p className="mt-1 text-xs text-[#737e78]">
                  Mô hình AI tự huấn luyện
                </p>
              </div>
            </div>

            <Link
              href="/projects"
              className="mt-7 inline-flex w-fit items-center gap-2 rounded-lg border border-brand px-4 py-2.5 text-sm font-semibold text-brand transition hover:bg-brand hover:text-white"
            >
              Khám phá EstateMind
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="grid min-h-[330px] grid-cols-[1.05fr_.95fr] gap-4">
            <div className="relative overflow-hidden rounded-xl">
              <Image
                src="https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1000&q=85"
                alt="Không gian nội thất bất động sản hiện đại"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 50vw, 30vw"
              />
            </div>

            <div className="relative mt-8 overflow-hidden rounded-xl">
              <Image
                src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1000&q=85"
                alt="Tư vấn bất động sản"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 50vw, 30vw"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
