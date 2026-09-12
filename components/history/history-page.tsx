"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronRight, ChevronLeft, Play, Film, Trash2, LayoutGrid, Clock3 } from "lucide-react";
import { useApp } from "@/components/providers";

const FILM_STOCKS = [
  { brand: "KODAK VISION3 500T", code: "EASTMAN 5219", gauge: "35MM SAFETY" },
  { brand: "FUJIFILM ETERNA 250D", code: "FUJI 8563", gauge: "35MM COLOR" },
  { brand: "EASTMAN DOUBLE-X", code: "SAFETY FILM 5222", gauge: "35MM B&W" },
  { brand: "KODAK PORTRA 400", code: "KODAK FILM", gauge: "35MM CINEMA" },
];

const FALLBACK_THUMB =
  "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&q=80";

export function HistoryPage() {
  const { history, removeFromHistory, clearHistory } = useApp();
  const scrollRef = useRef<HTMLDivElement>(null);
  const setRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<"reel" | "grid">("reel");
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
    if (viewMode !== "reel") return;

    let animId: number;

    const step = () => {
      const el = scrollRef.current;
      const setEl = setRef.current;

      if (el && setEl) {
        const W = setEl.offsetWidth;
        if (W > 10) {
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

            // Vòng tròn vô tận: Khi trôi qua hết Set 1 (tới 2 * W), nhảy ngược về W vô hình 100%
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
  }, [viewMode]);

  // Đặt lại trạng thái khi đổi chế độ hoặc thay đổi danh sách
  useEffect(() => {
    hasInitializedRef.current = false;
  }, [viewMode, history?.length]);

  const rawItems = history;
  let loopItems = [...rawItems];
  while (loopItems.length < 8 && loopItems.length > 0) {
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

  const formatTimeAgo = (timestamp: number) => {
    const diffMs = Date.now() - timestamp;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Vừa xong";
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays === 1) return "Hôm qua";
    if (diffDays < 30) return `${diffDays} ngày trước`;
    return new Date(timestamp).toLocaleDateString("vi-VN");
  };

  // Xử lý sự kiện scroll thủ công
  const handleScrollEvent = () => {
    const el = scrollRef.current;
    const setEl = setRef.current;
    if (!el || !setEl) return;
    const W = setEl.offsetWidth;
    if (W <= 10) return;

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
    <main className="page-shell">
      {/* Tiêu đề trang hoài niệm cuộn phim 35mm */}
      <div className="history-page-header">
        <div className="history-header-left">
          <div className="film-heading-left">
            <div className="film-header-icon-wrap" style={{ width: 34, height: 34 }}>
              <Film size={20} className="film-header-icon" />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <h1 style={{ margin: 0, fontSize: "clamp(22px, 3.5vw, 32px)", fontWeight: 800 }}>
                  Lịch sử xem
                </h1>
              </div>
              <p style={{ margin: "4px 0 0", color: "var(--muted)", fontSize: 13 }}>
                Danh sách các bộ phim bạn đang thưởng thức dở dang hoặc đã xem gần đây.
              </p>
            </div>
          </div>
        </div>

        {history.length > 0 && (
          <div className="history-header-actions">
            {/* Bộ chuyển đổi chế độ xem: Cuộn phim liền mạch / Lưới khung phim */}
            <div className="film-view-toggle">
              <button
                type="button"
                className={`film-toggle-btn ${viewMode === "reel" ? "active" : ""}`}
                onClick={() => setViewMode("reel")}
                title="Chế độ cuộn phim 35mm hoài niệm (Endless Reel)"
              >
                <Film size={15} /> Cuộn phim
              </button>
              <button
                type="button"
                className={`film-toggle-btn ${viewMode === "grid" ? "active" : ""}`}
                onClick={() => setViewMode("grid")}
                title="Chế độ lưới khung phim (Grid)"
              >
                <LayoutGrid size={15} /> Lưới phim
              </button>
            </div>

            {/* Nút mũi tên lướt cuộn phim (chỉ hiện khi ở chế độ reel) */}
            {viewMode === "reel" && (
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
            )}

            {/* Nút xóa toàn bộ lịch sử */}
            <button
              type="button"
              className="button history-clear-btn"
              onClick={() => {
                if (window.confirm("Bạn có chắc chắn muốn xóa toàn bộ lịch sử xem?")) {
                  clearHistory();
                }
              }}
            >
              <Trash2 size={15} /> Xóa toàn bộ lịch sử
            </button>
          </div>
        )}
      </div>

      {history.length > 0 ? (
        viewMode === "reel" ? (
          /* CHẾ ĐỘ 1: Cuộn phim nhựa chạy vòng tròn vô tận (Continuous Circular 35mm Filmstrip) */
          <div className="film-continuous-wrapper" style={{ marginTop: 20 }}>
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
                  key={`history-set-${setIndex}`}
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
                        key={`history-reel-${setIndex}-${item.id}-${idx}`}
                        className="film-seamless-unit"
                      >
                        <div className="film-cell-chassis">
                          {/* Mép lỗ răng cưa trên */}
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

                          {/* Khung hình phim (Aperture) */}
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
                              <div className="film-projector-overlay">
                                <div className="film-lens-btn">
                                  <Play size={18} fill="currentColor" />
                                </div>
                              </div>
                            </Link>

                            <div className="film-vintage-badge">
                              <span>{item.episodeName || (item.mediaType === "tv" ? "Tập 1" : "Bản Full")}</span>
                            </div>

                            <div className="film-optical-track">
                              <div
                                className="film-optical-fill"
                                style={{ width: `${Math.max(5, Math.min(100, item.percentage))}%` }}
                              />
                            </div>
                          </div>

                          {/* Mép lỗ răng cưa dưới */}
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

                        {/* Thông tin phim & các nút thao tác */}
                        <div className="film-meta-wrap">
                          <Link href={detailHref} className="film-movie-title" title={item.title}>
                            {item.title}
                          </Link>
                          <div className="film-meta-info">
                            <span className="film-time-left">
                              Đã xem {formatTime(item.currentTime)} / {formatTime(item.duration)}
                            </span>
                            <span className="film-progress-pct">{item.percentage}%</span>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--muted)" }}>
                            <Clock3 size={11} /> {formatTimeAgo(item.updatedAt)}
                          </div>

                          <div className="film-unit-actions">
                            <Link href={watchHref} className="film-resume-btn">
                              <Play size={12} fill="currentColor" /> Tiếp tục xem
                            </Link>
                            <button
                              type="button"
                              className="film-del-btn"
                              onClick={() => removeFromHistory(item.id)}
                              title="Xóa khỏi lịch sử"
                              aria-label="Xóa khỏi lịch sử"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* CHẾ ĐỘ 2: Lưới khung phim 35mm (Filmstrip Grid) */
          <div className="film-grid-layout">
            {history.map((item, idx) => {
              const mediaKey = item.slug || item.id;
              const watchHref =
                item.mediaType === "tv"
                  ? `/watch/tv/${mediaKey}/1/${(item.episodeIdx ?? 0) + 1}`
                  : `/watch/movie/${mediaKey}`;
              const detailHref = `/${item.mediaType}/${mediaKey}`;
              const thumbImg = item.backdropPath || item.posterPath || FALLBACK_THUMB;
              const filmStock = FILM_STOCKS[idx % FILM_STOCKS.length];
              const frameNumber = `▶ ${String(idx + 1).padStart(2, "0")}A`;
              const expNumber = `• ${String(18 + idx * 4)}`;

              return (
                <article key={`history-grid-${item.id}`} className="film-seamless-unit film-grid-unit">
                  <div className="film-cell-chassis">
                    {/* Mép lỗ răng cưa trên */}
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

                    {/* Khung hình phim */}
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
                        <div className="film-projector-overlay">
                          <div className="film-lens-btn">
                            <Play size={18} fill="currentColor" />
                          </div>
                        </div>
                      </Link>

                      <div className="film-vintage-badge">
                        <span>{item.episodeName || (item.mediaType === "tv" ? "Tập 1" : "Bản Full")}</span>
                      </div>

                      <div className="film-optical-track">
                        <div
                          className="film-optical-fill"
                          style={{ width: `${Math.max(5, Math.min(100, item.percentage))}%` }}
                        />
                      </div>
                    </div>

                    {/* Mép lỗ răng cưa dưới */}
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

                  {/* Thông tin phim */}
                  <div className="film-meta-wrap">
                    <Link href={detailHref} className="film-movie-title" title={item.title}>
                      {item.title}
                    </Link>
                    <div className="film-meta-info">
                      <span className="film-time-left">
                        Đã xem {formatTime(item.currentTime)} / {formatTime(item.duration)}
                      </span>
                      <span className="film-progress-pct">{item.percentage}%</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--muted)" }}>
                      <Clock3 size={11} /> {formatTimeAgo(item.updatedAt)}
                    </div>

                    <div className="film-unit-actions">
                      <Link href={watchHref} className="film-resume-btn">
                        <Play size={12} fill="currentColor" /> Tiếp tục xem
                      </Link>
                      <button
                        type="button"
                        className="film-del-btn"
                        onClick={() => removeFromHistory(item.id)}
                        title="Xóa khỏi lịch sử"
                        aria-label="Xóa khỏi lịch sử"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )
      ) : (
        /* Trạng thái trống khi chưa có phim nào */
        <div className="empty-history-state">
          <div className="empty-film-reel-icon">
            <Film size={48} strokeWidth={1.5} />
          </div>
          <h3>Chưa có lịch sử xem phim</h3>
          <p>
            Các bộ phim bạn đã hoặc đang xem dở dang sẽ tự động lưu lại ở đây theo phong cách
            cuộn phim 35mm để bạn dễ dàng tiếp tục theo dõi bất cứ lúc nào.
          </p>
          <Link href="/" className="button primary empty-explore-btn">
            Khám phá phim ngay
          </Link>
        </div>
      )}
    </main>
  );
}
