"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Play, Star } from "lucide-react";
import { Media } from "@/types/movie";

interface SpotlightBoxRailProps {
  title?: string;
  subtitle?: string;
  items: Media[];
  href?: string;
}

export function SpotlightBoxRail({
  title = "Điện ảnh Hàn Quốc",
  subtitle = "Xem toàn bộ",
  items,
  href = "/movies?country=han-quoc",
}: SpotlightBoxRailProps) {
  const router = useRouter();
  const displayItems = items.slice(0, 8);
  const total = displayItems.length;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [stageDimensions, setStageDimensions] = useState({
    slot1X: 315,
    slot2X: 470,
    centerScale: 1.20,
    side1Scale: 0.77,
    side2Scale: 0.56,
  });

  // Tạm dừng tự xoay tạm thời khi người dùng chủ động tương tác rồi tự tiếp tục
  const resumeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pauseTemporarily = useCallback((ms = 3500) => {
    setIsPaused(true);
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = setTimeout(() => {
      setIsPaused(false);
    }, ms);
  }, []);

  // Quản lý vuốt chạm đa điểm (1 ngón, 2 ngón) và kéo chuột (Drag)
  const isDragging = useRef(false);
  const lastWheelTime = useRef(0);
  const touchState = useRef<{
    mode: "none" | "one" | "two";
    startX: number;
    startAngle: number;
    startMidX: number;
    lastTriggerTime: number;
  }>({
    mode: "none",
    startX: 0,
    startAngle: 0,
    startMidX: 0,
    lastTriggerTime: 0,
  });

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % total);
  }, [total]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  }, [total]);

  // Điều chỉnh độ hé chiều ngang slot1X, slot2X và tỷ lệ phóng to theo độ phân giải
  useEffect(() => {
    const updateDims = () => {
      const w = window.innerWidth;
      const mobile = w < 768;
      setIsMobile(mobile);
      if (w < 480) {
        setStageDimensions({
          slot1X: 110,
          slot2X: 0,
          centerScale: 1.15,
          side1Scale: 0.82,
          side2Scale: 0,
        });
      } else if (w < 640) {
        setStageDimensions({
          slot1X: 135,
          slot2X: 0,
          centerScale: 1.18,
          side1Scale: 0.82,
          side2Scale: 0,
        });
      } else if (w < 768) {
        setStageDimensions({
          slot1X: 160,
          slot2X: 0,
          centerScale: 1.18,
          side1Scale: 0.82,
          side2Scale: 0,
        });
      } else if (w < 1024) {
        setStageDimensions({
          slot1X: 175,
          slot2X: 285,
          centerScale: 1.12,
          side1Scale: 0.74,
          side2Scale: 0.52,
        });
      } else if (w < 1280) {
        setStageDimensions({
          slot1X: 225,
          slot2X: 360,
          centerScale: 1.14,
          side1Scale: 0.76,
          side2Scale: 0.54,
        });
      } else {
        setStageDimensions({
          slot1X: 275,
          slot2X: 435,
          centerScale: 1.16,
          side1Scale: 0.78,
          side2Scale: 0.56,
        });
      }
    };
    updateDims();
    window.addEventListener("resize", updateDims);
    return () => window.removeEventListener("resize", updateDims);
  }, []);

  // TỰ ĐỘNG XOAY LIÊN TỤC SAU MỖI 3.0 GIÂY
  useEffect(() => {
    if (isPaused || total <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % total);
    }, 3000);
    return () => clearInterval(timer);
  }, [isPaused, total]);

  if (total === 0) return null;

  // Điều khiển bằng phím mũi tên bàn phím
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") handlePrev();
    if (e.key === "ArrowRight") handleNext();
  };

  // 1. Hỗ trợ xoay 2 ngón tay (Twist hoặc 2-finger swipe) & vuốt 1 ngón
  const handleTouchStart = (e: React.TouchEvent) => {
    const now = Date.now();
    if (e.touches.length >= 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const angle = Math.atan2(t2.clientY - t1.clientY, t2.clientX - t1.clientX);
      const midX = (t1.clientX + t2.clientX) / 2;
      touchState.current = {
        mode: "two",
        startX: 0,
        startAngle: angle,
        startMidX: midX,
        lastTriggerTime: now,
      };
      isDragging.current = true;
    } else if (e.touches.length === 1) {
      touchState.current = {
        mode: "one",
        startX: e.touches[0].clientX,
        startAngle: 0,
        startMidX: 0,
        lastTriggerTime: now,
      };
      isDragging.current = false;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const now = Date.now();
    const canTrigger = now - touchState.current.lastTriggerTime > 260;

    if (e.touches.length >= 2 && touchState.current.mode === "two") {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const angle = Math.atan2(t2.clientY - t1.clientY, t2.clientX - t1.clientX);
      const midX = (t1.clientX + t2.clientX) / 2;

      // Tính góc xoay giữa 2 ngón (Twist)
      let angleDiff = angle - touchState.current.startAngle;
      while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
      while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

      // Tính khoảng dịch chuyển ngang của cả 2 ngón (2-finger drag)
      const midXDiff = midX - touchState.current.startMidX;

      if (canTrigger) {
        // Xoay thuận hoặc vuốt sang phải
        if (angleDiff > 0.16 || midXDiff > 30) {
          handlePrev();
          touchState.current.startAngle = angle;
          touchState.current.startMidX = midX;
          touchState.current.lastTriggerTime = now;
        } 
        // Xoay nghịch hoặc vuốt sang trái
        else if (angleDiff < -0.16 || midXDiff < -30) {
          handleNext();
          touchState.current.startAngle = angle;
          touchState.current.startMidX = midX;
          touchState.current.lastTriggerTime = now;
        }
      }
    } else if (e.touches.length === 1 && touchState.current.mode === "one") {
      const diff = e.touches[0].clientX - touchState.current.startX;
      if (Math.abs(diff) > 10) {
        isDragging.current = true;
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchState.current.mode === "one") {
      if (e.changedTouches.length > 0) {
        const diff = e.changedTouches[0].clientX - touchState.current.startX;
        if (diff > 35) handlePrev();
        else if (diff < -35) handleNext();
      }
    }
    touchState.current.mode = "none";
    setTimeout(() => {
      isDragging.current = false;
    }, 60);
  };

  // 2. Kéo chuột trên máy tính
  const handleMouseDown = (e: React.MouseEvent) => {
    touchState.current.startX = e.clientX;
    touchState.current.mode = "one";
    isDragging.current = false;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (touchState.current.mode !== "one") return;
    if (Math.abs(e.clientX - touchState.current.startX) > 8) {
      isDragging.current = true;
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (touchState.current.mode === "one") {
      const diff = e.clientX - touchState.current.startX;
      if (diff > 35) handlePrev();
      else if (diff < -35) handleNext();
    }
    touchState.current.mode = "none";
    setTimeout(() => {
      isDragging.current = false;
    }, 60);
  };

  // 3. Hỗ trợ xoay bằng 2 ngón trên Trackpad máy tính (Wheel horizontal swipe)
  const handleWheel = (e: React.WheelEvent) => {
    const now = Date.now();
    if (now - lastWheelTime.current < 280) return;

    // Khi người dùng quẹt ngang 2 ngón trên trackpad
    if (Math.abs(e.deltaX) > 18 && Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
      if (e.deltaX > 0) {
        handleNext();
        lastWheelTime.current = now;
      } else {
        handlePrev();
        lastWheelTime.current = now;
      }
    }
  };

  const stepAngle = (2 * Math.PI) / total;

  return (
    <section 
      className="spotlight-box spotlight-3d-container"
      onKeyDown={handleKeyDown}
      tabIndex={0}
      aria-label={`Vòng xoay elip 3D ${title}`}
    >
      {/* Thanh tiêu đề & bộ điều hướng trên cùng (Header Bar) */}
      <div className="spotlight-header-bar">
        <div className="spotlight-header-left">
          <div className="spotlight-title-group">
            <h2>{title}</h2>
          </div>
          <Link href={href} className="spotlight-view-all">
            {subtitle} <ChevronRight size={15} />
          </Link>
        </div>

        <div className="spotlight-header-right">
          {/* Nhãn gợi ý cử chỉ */}
          <div className="spotlight-gesture-hint">
            <span>✌️ Vuốt hoặc xoay 3D</span>
          </div>

          {/* Dải chấm trạng thái (Dots) */}
          <div className="spotlight-dots-bar">
            {displayItems.map((_, dotIdx) => (
              <button
                key={`dot-${dotIdx}`}
                type="button"
                className={`spotlight-dot ${dotIdx === currentIndex ? "active" : ""}`}
                onClick={() => {
                  pauseTemporarily();
                  setCurrentIndex(dotIdx);
                }}
                aria-label={`Chuyển đến phim ${dotIdx + 1}`}
              />
            ))}
          </div>

          {/* Nút điều hướng & Bộ đếm số phim */}
          <div className="spotlight-nav-controls">
            <div className="spotlight-arrow-pair">
              <button 
                type="button" 
                className="spotlight-mini-btn" 
                onClick={() => {
                  pauseTemporarily();
                  handlePrev();
                }}
                aria-label="Phim trước"
              >
                <ChevronLeft size={18} />
              </button>
              <button 
                type="button" 
                className="spotlight-mini-btn" 
                onClick={() => {
                  pauseTemporarily();
                  handleNext();
                }}
                aria-label="Phim tiếp theo"
              >
                <ChevronRight size={18} />
              </button>
            </div>
            <div className="spotlight-slide-indicator">
              <span className="current">{String(currentIndex + 1).padStart(2, "0")}</span>
              <span className="separator">/</span>
              <span className="total">{String(total).padStart(2, "0")}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sân khấu xoay vòng elip dạng 3D (Cực lớn & Nổi bật) */}
      <div 
        className="spotlight-3d-stage"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
      >
        {/* Nút mũi tên nổi 2 bên sân khấu */}
        <button 
          type="button" 
          className="spotlight-stage-arrow prev" 
          onClick={() => {
            pauseTemporarily();
            handlePrev();
          }}
          aria-label="Phim trước"
        >
          <ChevronLeft size={24} />
        </button>
        <button 
          type="button" 
          className="spotlight-stage-arrow next" 
          onClick={() => {
            pauseTemporarily();
            handleNext();
          }}
          aria-label="Phim kế tiếp"
        >
          <ChevronRight size={24} />
        </button>

        {/* Các thẻ phim bố trí trên quỹ đạo elip 3D */}
        {displayItems.map((media, idx) => {
          const mediaKey = media.slug || media.id;
          const detailHref = `/${media.mediaType === "tv" ? "tv" : "movie"}/${mediaKey}`;
          const epCount = 6 + (idx % 15);
          const isActive = idx === currentIndex;

          // Tính toán vị trí elip trong không gian 3D
          let diff = (idx - currentIndex) % total;
          if (diff > total / 2) diff -= total;
          if (diff < -total / 2) diff += total;

          const absDiff = Math.abs(diff);
          const sign = diff > 0 ? 1 : -1;

          // TÍNH TOÁN 3D COVERFLOW MỞ RỘNG CHIỀU NGANG
          let x = 0;
          let z = 0;
          let rotY = 0;
          let scale = 1;
          let opacity = 0;
          let zIndex = 1;

          if (absDiff === 0) {
            // Thẻ trung tâm: vươn về phía trước màn hình (Z = +32px), đối diện trực tiếp
            x = 0;
            z = 32;
            rotY = 0;
            scale = stageDimensions.centerScale;
            opacity = 1;
            zIndex = 100;
          } else if (absDiff === 1) {
            // Thẻ cận kề 2 bên cánh: 1 lớp hé rộng sang 2 bên (slot1X)
            x = sign * stageDimensions.slot1X;
            z = isMobile ? -65 : -95;
            rotY = -sign * (isMobile ? 24 : 34);
            scale = stageDimensions.side1Scale;
            opacity = 0.88;
            zIndex = 60;
          } else if (absDiff === 2 && !isMobile) {
            // Thẻ xa hơn ở 2 cánh: chỉ hiển thị trên Desktop / màn hình lớn
            x = sign * stageDimensions.slot2X;
            z = -195;
            rotY = -sign * 48;
            scale = stageDimensions.side2Scale;
            opacity = 0.65;
            zIndex = 30;
          } else {
            // Các thẻ nằm ở nửa sau elip hoặc lớp thứ 2 trên mobile: ẩn hoàn toàn
            x = sign * (stageDimensions.slot2X || 280);
            z = -300;
            rotY = -sign * 60;
            scale = 0.35;
            opacity = 0;
            zIndex = 5;
          }

          const pointerEvents = (isMobile ? absDiff <= 1 : absDiff <= 2) ? "auto" : "none";

          return (
            <div
              key={`spotlight-3d-${mediaKey}-${idx}`}
              className={`spotlight-3d-card ${isActive ? "active" : `slot-${absDiff}`}`}
              style={{
                transform: `translate3d(${x.toFixed(1)}px, 0px, ${z.toFixed(1)}px) rotateY(${rotY.toFixed(1)}deg) scale(${scale.toFixed(3)})`,
                opacity,
                zIndex,
                pointerEvents,
              }}
              onClick={() => {
                if (isDragging.current) return;
                if (!isActive) {
                  pauseTemporarily();
                  setCurrentIndex(idx);
                } else {
                  router.push(detailHref);
                }
              }}
            >
              <div className="spotlight-thumb-wrap">
                <img
                  src={media.backdropPath || media.posterPath}
                  alt={media.title}
                  loading="lazy"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src =
                      "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=85";
                  }}
                />
                <div className="spotlight-overlay">
                  <div className="spotlight-play-circle">
                    <Play size={24} fill="#fff" />
                  </div>
                </div>

                <div className="spotlight-badges">
                  <span className="badge-pd">PĐ. {epCount}</span>
                  {idx % 2 === 0 && (
                    <span className="badge-tm">TM. {Math.max(1, epCount - 2)}</span>
                  )}
                </div>

                {media.voteAverage && (
                  <div className="spotlight-card-rating">
                    <Star size={12} fill="currentColor" /> {media.voteAverage.toFixed(1)}
                  </div>
                )}
              </div>

              <div className="spotlight-info">
                <h3 className="spotlight-title" title={media.title}>
                  {media.title}
                </h3>
                {media.originalTitle && (
                  <span className="spotlight-sub" title={media.originalTitle}>
                    {media.originalTitle}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
