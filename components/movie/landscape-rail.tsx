"use client";

import { useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { ChevronRight, ChevronLeft, Play } from "lucide-react";
import { Media } from "@/types/movie";
import { Card3D } from "@/components/ui/card-3d";

interface LandscapeRailProps {
  title?: string;
  items: Media[];
  href?: string;
}

const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=85";

// Góc nghiêng 3D lập thể mạnh mẽ hơn (so le ấn tượng theo yêu cầu của bạn)
const TILT_ANGLES = [
  { y: 18, x: 4 },    // Thẻ 1: nghiêng phải mạnh mẽ 18 độ
  { y: -16, x: 4 },   // Thẻ 2: nghiêng trái mạnh mẽ 16 độ
  { y: 17, x: 4 },    // Thẻ 3: nghiêng phải 17 độ
  { y: -15, x: 4 },   // Thẻ 4: nghiêng trái 15 độ
  { y: 16, x: 4 },    // Thẻ 5: nghiêng phải 16 độ
  { y: -14, x: 4 },   // Thẻ 6: nghiêng trái 14 độ
  { y: 15, x: 4 },    // Thẻ 7: nghiêng phải 15 độ
  { y: -15, x: 4 },   // Thẻ 8: nghiêng trái 15 độ
];

export function LandscapeRail({
  title = "Dấu ấn điện ảnh Việt",
  items,
  href = "/movies?country=viet-nam",
}: LandscapeRailProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const setRef = useRef<HTMLDivElement>(null);
  const isHoveredRef = useRef(false);
  const isTouchingRef = useRef(false);
  const isInteractingRef = useRef(false);
  const scrollPosRef = useRef(0);
  const hasInitializedRef = useRef(false);
  const resumeTimerRef = useRef<NodeJS.Timeout | null>(null);

  const rawItems = items.slice(0, 10);
  let loopItems = [...rawItems];
  while (loopItems.length < 8 && loopItems.length > 0) {
    loopItems = [...loopItems, ...rawItems];
  }

  const pauseTemporarily = useCallback((ms = 2500) => {
    isInteractingRef.current = true;
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = setTimeout(() => {
      isInteractingRef.current = false;
      if (scrollRef.current) {
        scrollPosRef.current = scrollRef.current.scrollLeft;
      }
    }, ms);
  }, []);

  // Tự động chạy ngang vòng tròn vô tận (Endless Circular Auto-scroll)
  useEffect(() => {
    let animId: number;

    const step = () => {
      const el = scrollRef.current;
      const setEl = setRef.current;

      if (el && setEl) {
        const gap = parseFloat(window.getComputedStyle(setEl).marginRight) || 24;
        const W = setEl.offsetWidth + gap; // chiều rộng chuẩn xác 1 set kèm margin
        if (W > 300) {
          // Khởi tạo ban đầu ở Set 1 để có buffer chạy lùi và chạy tới mượt mà
          if (!hasInitializedRef.current) {
            el.scrollLeft = W;
            scrollPosRef.current = W;
            hasInitializedRef.current = true;
          }

          if (
            !isHoveredRef.current &&
            !isTouchingRef.current &&
            !isInteractingRef.current
          ) {
            scrollPosRef.current += 0.8; // Tốc độ trôi êm ái chuẩn điện ảnh

            // Chạy xoay vòng tròn: khi trôi hết Set 1, nhảy ngược về W vô hình
            if (scrollPosRef.current >= 2 * W) {
              scrollPosRef.current -= W;
              el.scrollLeft = scrollPosRef.current;
            } else {
              el.scrollLeft = scrollPosRef.current;
            }
          }
        }
      }

      animId = requestAnimationFrame(step);
    };

    animId = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(animId);
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    };
  }, []);

  // Hỗ trợ cuộn tay và vuốt chạm xoay vòng tròn
  const handleScrollEvent = () => {
    const el = scrollRef.current;
    const setEl = setRef.current;
    if (!el || !setEl) return;
    const gap = parseFloat(window.getComputedStyle(setEl).marginRight) || 24;
    const W = setEl.offsetWidth + gap;
    if (W <= 300) return;

    if (isHoveredRef.current || isTouchingRef.current || isInteractingRef.current) {
      const cur = el.scrollLeft;
      if (cur >= 2 * W) {
        el.scrollLeft = cur - W;
        scrollPosRef.current = cur - W;
      } else if (cur < W * 0.5) {
        el.scrollLeft = cur + W;
        scrollPosRef.current = cur + W;
      } else {
        scrollPosRef.current = cur;
      }
    }
  };

  const handleScroll = (direction: "left" | "right") => {
    pauseTemporarily(2500);
    const el = scrollRef.current;
    const setEl = setRef.current;
    if (!el || !setEl) return;
    const gap = parseFloat(window.getComputedStyle(setEl).marginRight) || 24;
    const W = setEl.offsetWidth + gap;
    if (W <= 300) return;

    const scrollDistance = 580;
    let targetLeft =
      direction === "left"
        ? el.scrollLeft - scrollDistance
        : el.scrollLeft + scrollDistance;

    if (targetLeft >= 2 * W) {
      el.scrollLeft -= W;
      targetLeft -= W;
    } else if (targetLeft < W * 0.5) {
      el.scrollLeft += W;
      targetLeft += W;
    }

    el.scrollTo({
      left: targetLeft,
      behavior: "smooth",
    });
    scrollPosRef.current = targetLeft;
  };

  return (
    <section className="landscape-section">
      <div className="section-heading">
        <h2>
          <Link href={href} className="heading-link">
            {title} <ChevronRight size={18} />
          </Link>
        </h2>
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
          {href && (
            <Link href={href}>
              Xem tất cả <ChevronRight size={15} />
            </Link>
          )}
        </div>
      </div>

      <div
        className="landscape-scroll"
        ref={scrollRef}
        onMouseEnter={() => {
          isHoveredRef.current = true;
        }}
        onMouseLeave={() => {
          isHoveredRef.current = false;
          if (scrollRef.current) {
            scrollPosRef.current = scrollRef.current.scrollLeft;
          }
        }}
        onTouchStart={() => {
          isTouchingRef.current = true;
        }}
        onTouchEnd={() => {
          isTouchingRef.current = false;
          if (scrollRef.current) {
            scrollPosRef.current = scrollRef.current.scrollLeft;
          }
          pauseTemporarily(1500);
        }}
        onScroll={handleScrollEvent}
      >
        {/* 3 Set phim liền mạch nối đuôi nhau chạy vòng tròn */}
        {[0, 1, 2].map((setIndex) => (
          <div
            key={`landscape-set-${setIndex}`}
            className="landscape-set-loop"
            ref={setIndex === 0 ? setRef : undefined}
          >
            {loopItems.map((media, idx) => {
              const mediaKey = media.slug || media.id;
              const detailHref = `/${media.mediaType === "tv" ? "tv" : "movie"}/${mediaKey}`;
              const year = media.releaseDate ? media.releaseDate.slice(0, 4) : "2026";
              const ratingBadge = idx % 2 === 0 ? "P" : "T13";
              const tilt = TILT_ANGLES[idx % TILT_ANGLES.length];
              const backdropSrc = media.backdropPath || media.posterPath || FALLBACK_IMG;
              const posterSrc = media.posterPath || media.backdropPath || FALLBACK_IMG;

              return (
                <article
                  key={`landscape-${setIndex}-${mediaKey}-${idx}`}
                  className="landscape-card"
                >
                  {/* Thẻ bài 3D ngang với góc nghiêng mạnh mẽ hơn và hiệu ứng tương tác */}
                  <Card3D
                    className="landscape-card-3d"
                    maxTilt={20}
                    defaultTiltY={tilt.y}
                    defaultTiltX={tilt.x}
                  >
                    <div className="landscape-poster-wrap">
                      <Link
                        href={detailHref}
                        className="landscape-poster"
                        aria-label={media.title}
                      >
                        <img
                          src={backdropSrc}
                          alt={media.title}
                          loading="lazy"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = FALLBACK_IMG;
                          }}
                        />
                        <div className="landscape-poster-overlay">
                          <span className="landscape-play-btn">
                            <Play size={22} fill="#fff" />
                          </span>
                        </div>
                      </Link>

                      {/* Nhãn lồng tiếng */}
                      <div className="landscape-badge">
                        <span>L.Tiếng</span>
                      </div>

                      {/* Mini Poster đè góc trái kèm fallback */}
                      <div className="mini-poster">
                        <img
                          src={posterSrc}
                          alt={media.title}
                          loading="lazy"
                          onError={(e) => {
                            const imgEl = e.currentTarget as HTMLImageElement;
                            if (media.backdropPath && imgEl.src !== media.backdropPath) {
                              imgEl.src = media.backdropPath;
                            } else {
                              imgEl.src = FALLBACK_IMG;
                            }
                          }}
                        />
                      </div>
                    </div>
                  </Card3D>

                  {/* Thông tin phim phía dưới */}
                  <div className="landscape-info">
                    <Link href={detailHref} className="landscape-title" title={media.title}>
                      {media.title}
                    </Link>
                    {media.originalTitle && (
                      <span className="landscape-sub" title={media.originalTitle}>
                        {media.originalTitle}
                      </span>
                    )}
                    <div className="landscape-meta">
                      <span className="age-tag">{ratingBadge}</span>
                      <span>•</span>
                      <span>{year}</span>
                      <span>•</span>
                      <span>{media.runtime ? `${media.runtime}m` : "1h 51m"}</span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ))}
      </div>
    </section>
  );
}
