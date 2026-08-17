import Link from "next/link";
import { ArrowRight } from "lucide-react";

import PropertyCard from "@/components/PropertyCard";
import { Property } from "@/types/property";

interface Props {
  properties: Property[];
}

export default function FeaturedProjects({ properties }: Props) {
  return (
    <section className="mx-auto max-w-[1180px] px-5 py-16 sm:px-6 lg:py-20">
      <div className="mb-8 flex items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold tracking-[-0.035em] text-[#202523]">
            Bất động sản nổi bật
          </h2>

          <p className="mt-2 text-sm text-[#68736d]">
            Khám phá những bất động sản nổi bật được EstateMind tuyển chọn.
          </p>
        </div>

        <Link
          href="/projects"
          className="hidden items-center gap-1.5 text-sm font-semibold text-brand transition hover:gap-2.5 sm:inline-flex"
        >
          Xem tất cả bất động sản
          <ArrowRight size={16} />
        </Link>
      </div>

      {properties.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {properties.map((property, index) => (
            <PropertyCard
              key={property.id}
              property={property}
              priority={index < 3}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-[#cfd8d3] bg-white py-14 text-center text-sm text-[#78837d]">
          Chưa có bất động sản nổi bật để hiển thị.
        </div>
      )}

      <Link
        href="/projects"
        className="mt-7 inline-flex items-center gap-1.5 text-sm font-semibold text-brand sm:hidden"
      >
        Xem tất cả bất động sản
        <ArrowRight size={16} />
      </Link>
    </section>
  );
}
