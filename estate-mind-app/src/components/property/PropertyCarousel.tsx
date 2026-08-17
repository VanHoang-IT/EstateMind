"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PropertyCarouselProps {
  images: string[];
  title: string;
  autoPlayMs?: number;
}

export default function PropertyCarousel({
  images,
  title,
  autoPlayMs = 4000,
}: PropertyCarouselProps) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const total = images.length;

  const goTo = useCallback(
    (next: number) => {
      if (total === 0) return;
      setIndex(((next % total) + total) % total);
    },
    [total],
  );

  const next = useCallback(() => goTo(index + 1), [goTo, index]);
  const prev = useCallback(() => goTo(index - 1), [goTo, index]);

  useEffect(() => {
    if (paused || total <= 1) return;

    const timer = setInterval(() => {
      setIndex((current) => (current + 1) % total);
    }, autoPlayMs);

    return () => clearInterval(timer);
  }, [paused, total, autoPlayMs]);

  if (total === 0) {
    return null;
  }

  return (
    <div
      className="relative mb-8 h-[300px] w-full overflow-hidden rounded-xl bg-gray-200 lg:h-[420px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        className="flex h-full transition-transform duration-700 ease-out"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {images.map((src, position) => (
          <div
            key={`${src}-${position}`}
            className="relative h-full w-full shrink-0"
          >
            <Image
              src={src}
              alt={`${title} - ảnh ${position + 1}`}
              fill
              sizes="(max-width: 1024px) 100vw, 1180px"
              className="object-cover"
              priority={position === 0}
            />
          </div>
        ))}
      </div>

      {total > 1 && (
        <>
          <button
            type="button"
            onClick={prev}
            aria-label="Ảnh trước"
            className="absolute left-3 top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-[#2f3934] shadow-md transition hover:bg-white"
          >
            <ChevronLeft size={20} />
          </button>

          <button
            type="button"
            onClick={next}
            aria-label="Ảnh tiếp theo"
            className="absolute right-3 top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-[#2f3934] shadow-md transition hover:bg-white"
          >
            <ChevronRight size={20} />
          </button>

          <div className="absolute bottom-3 right-3 z-10 rounded-md bg-black/55 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
            {index + 1} / {total}
          </div>

          <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
            {images.slice(0, 10).map((_, position) => (
              <button
                key={position}
                type="button"
                onClick={() => goTo(position)}
                aria-label={`Xem ảnh ${position + 1}`}
                className={`h-1.5 rounded-full transition-all ${
                  position === index % 10
                    ? "w-5 bg-white"
                    : "w-1.5 bg-white/55 hover:bg-white/80"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
