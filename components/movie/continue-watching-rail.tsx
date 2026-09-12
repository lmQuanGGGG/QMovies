"use client";

import { useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { ChevronRight, ChevronLeft, Play, Film } from "lucide-react";
import { useApp } from "@/components/providers";

const FILM_STOCKS = [
  { brand: "KODAK VISION3 500T", code: "EASTMAN 5219", gauge: "35MM SAFETY" },
  { brand: "FUJIFILM ETERNA 250D", code: "FUJI 8563", gauge: "35MM COLOR" },
  { brand: "EASTMAN DOUBLE-X", code: "SAFETY FILM 5222", gauge: "35MM B&W" },
  { brand: "KODAK PORTRA 400", code: "KODAK FILM", gauge: "35MM CINEMA" },
];

const FALLBACK_THUMB =
  "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&q=80";

export function ContinueWatchingRail() {
  const { history } = useApp();
  const scrollRef = useRef<HTMLDivElement>(null);
  const setRef = useRef<HTMLDivElement>(null);
  const isHoveredRef = useRef(false);
  const isTouchingRef = useRef(false);
  const isInteractingRef = useRef(false);
  const scrollPosRef = useRef(0);
  const hasInitializedRef = useRef(false);
  const resumeTimerRef = useRef<NodeJS.Timeout | null>(null);

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

  // Tự động chạy ngang xoay vòng tròn vô tận (Continuous Circular Infinite Loop)
  useEffect(() => {
    let animId: number;

    const step = () => {
      const el = scrollRef.current;
      const setEl = setRef.current;

      if (el && setEl) {
        const W = setEl.offsetWidth;
        if (W > 10) {
          // Khởi tạo vị trí ban đầu ở đầu Set 1 (index 1) để cuộn lùi và cuộn tới đều liền mạch
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
            scrollPosRef.current += 0.65; // Tốc độ trôi êm ái chuẩn điện ảnh

            // Chạy vòng tròn vô tận: Khi trôi qua hết Set 1 (tới 2 * W), nhảy ngược về W vô hình 100%
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

  // Khi danh sách phim thay đổi (thêm/xóa), cho phép tính toán lại vị trí
  useEffect(() => {
    if (history && history.length > 0) {
      hasInitializedRef.current = false;
    }
  }, [history?.length]);

  if (!history || history.length === 0) return null;

  const rawItems = history.slice(0, 10);
  // Nhân bản để 1 set có tối thiểu 8 khung phim, vượt qua chiều rộng mọi màn hình lớn
  let loopItems = [...rawItems];
  while (loopItems.length < 8) {
    loopItems = [...loopItems, ...rawItems];
  }

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return "00:00";
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Xử lý sự kiện scroll thủ công (vuốt cảm ứng hoặc kéo chuột)
  const handleScrollEvent = () => {
    const el = scrollRef.current;
    const setEl = setRef.current;
    if (!el || !setEl) return;
    const W = setEl.offsetWidth;
    if (W <= 10) return;

    if (isHoveredRef.current || isTouchingRef.current || isInteractingRef.current) {
      const cur = el.scrollLeft;
      // Vòng tròn vô tận 2 chiều khi cuộn thủ công
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

  // Nút mũi tên chuyển tới / lui cuộn phim
  const handleScroll = (direction: "left" | "right") => {
    pauseTemporarily(2500);
    const el = scrollRef.current;
    const setEl = setRef.current;
    if (!el || !setEl) return;
    const W = setEl.offsetWidth;
    if (W <= 10) return;

    const scrollDistance = 320;
    let targetLeft =
      direction === "left"
        ? el.scrollLeft - scrollDistance
        : el.scrollLeft + scrollDistance;

    // Giữ vị trí trong vùng an toàn của vòng lặp
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
    <section className="rail continue-watching-rail film-reel-section">
      <div className="section-heading film-reel-heading">
        <div className="film-heading-left">
          <div className="film-header-icon-wrap">
            <Film size={18} className="film-header-icon" />
          </div>
          <h2>Tiếp tục xem</h2>
        </div>

        <div className="film-heading-actions">
          <div className="film-scroll-arrows">
            <button
              type="button"
              onClick={() => handleScroll("left")}
              className="film-arrow-btn"
              aria-label="Cuộn lùi cuộn phim"
              title="Cuộn lùi cuộn phim"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={() => handleScroll("right")}
              className="film-arrow-btn"
              aria-label="Cuộn tiếp cuộn phim"
              title="Cuộn tiếp cuộn phim"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <Link href="/history" className="film-history-link">
            Lịch sử xem <ChevronRight size={15} />
          </Link>
        </div>
      </div>

      {/* Cuộn phim nhựa chạy vòng tròn vô tận (Continuous Circular 35mm Filmstrip) */}
      <div className="film-continuous-wrapper">
        <div
          className="film-continuous-scroll"
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
          {/* 3 Set phim liền mạch nối đuôi nhau tạo thành vòng tròn vô tận */}
          {[0, 1, 2].map((setIndex) => (
            <div
              key={`film-set-${setIndex}`}
              className="film-set-loop"
              ref={setIndex === 0 ? setRef : undefined}
            >
              {loopItems.map((item, idx) => {
                const mediaKey = item.slug || item.id;
                const watchHref =
                  item.mediaType === "tv"
                    ? `/watch/tv/${mediaKey}/1/${(item.episodeIdx ?? 0) + 1}`
                    : `/watch/movie/${mediaKey}`;
                const detailHref = `/${item.mediaType}/${mediaKey}`;
                const thumbImg = item.backdropPath || item.posterPath || FALLBACK_THUMB;
                const filmStock = FILM_STOCKS[(setIndex * loopItems.length + idx) % FILM_STOCKS.length];
                const frameNumber = `▶ ${String(((idx % 24) + 1)).padStart(2, "0")}A`;
                const expNumber = `• ${String(18 + ((idx * 4) % 80))}`;

                return (
                  <article
                    key={`continue-${setIndex}-${item.id}-${idx}`}
                    className="film-seamless-unit"
                  >
                    {/* Phần dải phim nhựa 35mm (Nối liền nhau 100% không đứt đoạn) */}
                    <div className="film-cell-chassis">
                      {/* Mép lỗ răng cưa trên & ký hiệu cuộn phim */}
                      <div className="film-sprocket-track top">
                        <div className="film-holes-row">
                          <span className="film-sprocket-hole" />
                          <span className="film-sprocket-hole" />
                          <span className="film-sprocket-hole" />
                          <span className="film-sprocket-hole" />
                          <span className="film-sprocket-hole" />
                          <span className="film-sprocket-hole" />
                        </div>
                        <div className="film-edge-codes">
                          <span className="film-edge-brand">{filmStock.brand}</span>
                          <span className="film-edge-frame">{frameNumber}</span>
                          <span className="film-edge-gauge">{filmStock.gauge}</span>
                        </div>
                      </div>

                      {/* Khung cửa sổ chiếu phim (Aperture) */}
                      <div className="film-aperture-wrap">
                        <Link href={watchHref} className="film-aperture-link">
                          <img
                            src={thumbImg}
                            alt={item.title}
                            loading="lazy"
                            className="film-frame-image"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = FALLBACK_THUMB;
                            }}
                          />

                          {/* Hiệu ứng rọi đèn máy chiếu phim khi hover */}
                          <div className="film-projector-overlay">
                            <div className="film-lens-btn">
                              <Play size={18} fill="currentColor" />
                            </div>
                          </div>
                        </Link>

                        {/* Nhãn tem vintage tập phim */}
                        <div className="film-vintage-badge">
                          <span>{item.episodeName || (item.mediaType === "tv" ? "Tập 1" : "Bản Full")}</span>
                        </div>

                        {/* Thanh tiến trình dải quang học (Optical Soundtrack Track) */}
                        <div className="film-optical-track">
                          <div
                            className="film-optical-fill"
                            style={{ width: `${Math.max(5, Math.min(100, item.percentage))}%` }}
                          />
                        </div>
                      </div>

                      {/* Mép lỗ răng cưa dưới & ký hiệu cuộn phim */}
                      <div className="film-sprocket-track bottom">
                        <div className="film-edge-codes">
                          <span className="film-edge-code">{filmStock.code}</span>
                          <span className="film-edge-frame">{expNumber}</span>
                          <span className="film-edge-fps">24 FPS</span>
                        </div>
                        <div className="film-holes-row">
                          <span className="film-sprocket-hole" />
                          <span className="film-sprocket-hole" />
                          <span className="film-sprocket-hole" />
                          <span className="film-sprocket-hole" />
                          <span className="film-sprocket-hole" />
                          <span className="film-sprocket-hole" />
                        </div>
                      </div>
                    </div>

                    {/* Thông tin tên phim bên dưới khung hình (Chữ đen rõ nét ở chế độ sáng) */}
                    <div className="film-meta-wrap">
                      <Link href={detailHref} className="film-movie-title" title={item.title}>
                        {item.title}
                      </Link>
                      <div className="film-meta-info">
                        <span className="film-time-left">
                          Còn lại {formatTime(Math.max(0, item.duration - item.currentTime))}
                        </span>
                        <span className="film-progress-pct">{item.percentage}%</span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
