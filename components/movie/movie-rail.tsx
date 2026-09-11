"use client";

import { useRef } from "react";
import Link from "next/link";
import { ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Media } from "@/types/movie";
import { MovieCard } from "@/components/movie/movie-card";

export function MovieRail({
  title,
  items,
  href = "/movies",
}: {
  title: string;
  items: Media[];
  href?: string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollDistance = 460;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollDistance : scrollDistance,
        behavior: "smooth",
      });
    }
  };

  return (
    <section className="rail">
      <div className="section-heading">
        <h2>{title}</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div className="rail-nav-arrows">
            <button
              type="button"
              className="rail-arrow-btn"
              onClick={() => handleScroll("left")}
              aria-label="Cuộn lùi danh sách"
              title="Cuộn lùi"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              className="rail-arrow-btn"
              onClick={() => handleScroll("right")}
              aria-label="Cuộn tiếp danh sách"
              title="Cuộn tiếp"
            >
              <ChevronRight size={16} />
            </button>
          </div>
          <Link href={href}>
            Xem tất cả <ArrowUpRight size={15} />
          </Link>
        </div>
      </div>
      <div className="rail-scroll" ref={scrollRef}>
        {items.map((media) => (
          <MovieCard key={`${title}-${media.slug || media.id}`} media={media} />
        ))}
      </div>
    </section>
  );
}
