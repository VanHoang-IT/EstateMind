import Image from "next/image";
import SearchBar from "@/components/SearchBar";

export default function HomeHero() {
  return (
    <section className="relative min-h-[540px] overflow-hidden">
      <Image
        src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=2000&q=90"
        alt="Ngôi nhà hiện đại cao cấp"
        fill
        priority
        className="object-cover"
        sizes="100vw"
      />

      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,25,35,0.55),rgba(5,20,20,0.47))]" />

      <div className="relative z-10 mx-auto flex min-h-[540px] max-w-[1180px] flex-col items-center justify-center px-5 py-16 text-center text-white sm:px-6">
        <span className="mb-4 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-xs font-semibold tracking-[0.08em] backdrop-blur-sm">
          KHÁM PHÁ BẤT ĐỘNG SẢN THÔNG MINH
        </span>

        <h1 className="max-w-4xl text-4xl font-bold tracking-[-0.045em] sm:text-5xl lg:text-[58px] lg:leading-[1.02]">
          Tìm bất động sản phù hợp với bạn
        </h1>

        <p className="mt-5 max-w-2xl text-sm leading-6 text-white/88 sm:text-base">
          Khám phá những bất động sản phù hợp với nhu cầu và phong cách sống của
          bạn. Tìm kiếm thông minh hơn cùng EstateMind.
        </p>

        <div className="mt-9 w-full max-w-[980px]">
          <SearchBar />
        </div>
      </div>
    </section>
  );
}
