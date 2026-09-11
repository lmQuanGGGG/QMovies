"use client";

import { useRef } from "react";
import Link from "next/link";
import { ChevronRight, ChevronLeft, Play } from "lucide-react";
import { Media } from "@/types/movie";
import { Card3D } from "@/components/ui/card-3d";

interface Top10RailProps {
  title?: string;
  items: Media[];
  href?: string;
}

export function Top10Rail({
  title = "Top 10 phim lẻ hôm nay",
  items,
  href = "/movies",
}: Top10RailProps) {
  const topItems = items.slice(0, 10);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollDistance = 560;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollDistance : scrollDistance,
        behavior: "smooth",
      });
    }
  };

  return (
    <section className="top10-section">
      <div className="section-heading">
        <h2>{title}</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div className="rail-nav-arrows">
            <button
              type="button"
              className="rail-arrow-btn"
              onClick={() => handleScroll("left")}
              aria-label="Cuộn lùi Top 10"
              title="Cuộn lùi"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              className="rail-arrow-btn"
              onClick={() => handleScroll("right")}
              aria-label="Cuộn tiếp Top 10"
              title="Cuộn tiếp"
            >
              <ChevronRight size={16} />
            </button>
          </div>
          {href && (
            <Link href={href}>
              Xem tất cả <ChevronRight size={15} />
            </Link>
          )}
        </div>
      </div>

      <div className="top10-scroll" ref={scrollRef}>
        {topItems.map((media, idx) => {
          const rank = idx + 1;
          const mediaKey = media.slug || media.id;
          const detailHref = `/${media.mediaType === "tv" ? "tv" : "movie"}/${mediaKey}`;
          const year = media.releaseDate ? media.releaseDate.slice(0, 4) : "2026";
          const ratingBadge = rank <= 3 ? "P" : rank <= 6 ? "T13" : "T16";
          // Góc nghiêng 3D lập thể tự động sẵn cho từng lá bài (so le như mẫu)
          const tiltAngles = [
            { y: 13, x: 3 },   // Top 1: quay phải (cạnh trái gần mắt)
            { y: -11, x: 3 },  // Top 2: quay trái (cạnh phải gần mắt)
            { y: 11, x: 3 },   // Top 3: quay phải
            { y: -10, x: 3 },  // Top 4: quay trái
            { y: 9, x: 3 },    // Top 5: quay phải
            { y: -9, x: 3 },   // Top 6: quay trái
            { y: 8, x: 3 },    // Top 7: quay phải
            { y: -8, x: 3 },   // Top 8: quay trái
            { y: 7, x: 3 },    // Top 9: quay phải
            { y: -7, x: 3 },   // Top 10: quay trái
          ];
          const tilt = tiltAngles[idx] || { y: (idx % 2 === 0 ? 8 : -8), x: 3 };

          return (
            <article key={`top10-${mediaKey}-${rank}`} className="top10-card">
              {/* Hiệu ứng thẻ bài 3D tự động sẵn */}
              <Card3D 
                className="top10-card-3d" 
                maxTilt={16}
                defaultTiltY={tilt.y}
                defaultTiltX={tilt.x}
              >
                <div className="top10-poster-wrap">
                  <Link href={detailHref} className="top10-poster">
                    <img
                      src={media.posterPath}
                      alt={media.title}
                      loading="lazy"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src =
                          "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=85";
                      }}
                    />
                    <div className="top10-poster-overlay">
                      <span className="top10-play-btn">
                        <Play size={20} fill="#fff" />
                      </span>
                    </div>
                  </Link>

                  <div className="top10-badges">
                    <span className="badge-pd">P.Đề</span>
                    {media.lang?.toLowerCase().includes("thuyết minh") && (
                      <span className="badge-tm">T.Minh</span>
                    )}
                  </div>
                </div>
              </Card3D>

              {/* Thông tin phim kèm số thứ hạng to */}
              <div className="top10-info">
                <span className="top10-rank-num">{rank}</span>
                <div className="top10-meta">
                  <Link href={detailHref} className="top10-title" title={media.title}>
                    {media.title}
                  </Link>
                  {media.originalTitle && (
                    <span className="top10-sub" title={media.originalTitle}>
                      {media.originalTitle}
                    </span>
                  )}
                  <div className="top10-tags">
                    <span className="age-tag">{ratingBadge}</span>
                    <span>•</span>
                    <span>{year}</span>
                    <span>•</span>
                    <span>{media.runtime ? `${media.runtime}m` : "1h 45m"}</span>
                    {media.quality && (
                      <>
                        <span>•</span>
                        <span className="quality-tag">{media.quality}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
