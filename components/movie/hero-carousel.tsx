"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { BookmarkPlus, ChevronLeft, ChevronRight, Play, Star } from "lucide-react";
import { Media } from "@/types/movie";

interface HeroCarouselProps {
  items: Media[];
  intervalMs?: number;
}

export function HeroCarousel({ items, intervalMs = 6000 }: HeroCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const heroItems = items.slice(0, 5);
  const total = heroItems.length;

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % total);
  }, [total]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  }, [total]);

  // Tự động chuyển phim sau mỗi 6 giây
  useEffect(() => {
    if (isPaused || total <= 1) return;
    const timer = setInterval(() => {
      handleNext();
    }, intervalMs);
    return () => clearInterval(timer);
  }, [handleNext, intervalMs, isPaused, total]);

  if (total === 0) return null;

  const hero = heroItems[currentIndex];
  const heroYear = hero.releaseDate ? hero.releaseDate.slice(0, 4) : "2024";
  const heroKey = hero.slug || hero.id;

  return (
    <section 
      className="hero hero-carousel"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Các lớp ảnh nền chuyển đổi mượt mà */}
      {heroItems.map((item, idx) => (
        <div
          key={`bg-${item.slug || item.id}-${idx}`}
          className={`hero-slide ${idx === currentIndex ? "active" : ""}`}
          style={{ backgroundImage: `url(${item.backdropPath})` }}
        />
      ))}

      <div className="hero-shade" />

      {/* Thanh đáy Hero: Cố định vị trí thông tin phim bên trái & ngang hàng với 5 thumbnails bên phải */}
      <div className="hero-bottom-bar">
        {/* Nội dung thông tin phim - Khóa cứng vị trí đồng nhất cho tất cả các phim */}
        <div className="hero-content" key={`content-${heroKey}`}>
          <h1 className="hero-title">{hero.title}</h1>
          <div className="facts">
            <span>
              <Star size={15} fill="currentColor" /> {hero.voteAverage ? hero.voteAverage.toFixed(1) : "8.0"}
            </span>
            <span>{heroYear}</span>
            {hero.quality && <span>{hero.quality}</span>}
            {hero.lang && <span>{hero.lang}</span>}
            {hero.genres && hero.genres[0] && <span>{hero.genres[0]}</span>}
          </div>
          <p className="hero-overview">
            {hero.overview ? hero.overview.slice(0, 180) + "..." : "Xem ngay các tập mới nhất với chất lượng cao."}
          </p>
          <div className="cta-row">
            <Link 
              className="button primary" 
              href={`/watch/${hero.mediaType}/${heroKey}${hero.mediaType === "tv" ? "/1/1" : ""}`}
            >
              <Play size={18} fill="currentColor" /> Xem ngay
            </Link>
            <Link 
              className="button ghost hero-ghost" 
              href={`/${hero.mediaType === "tv" ? "tv" : "movie"}/${heroKey}`}
            >
              <BookmarkPlus size={18} /> Chi tiết
            </Link>
          </div>
        </div>

        {/* 5 Thumbnails góc dưới bên phải - Ngang hàng chuẩn xác với nút Xem ngay */}
        <div className="hero-thumbnails">
          {heroItems.map((item, idx) => {
            const isActive = idx === currentIndex;
            const thumbImg = item.backdropPath || item.posterPath;
            return (
              <button
                key={`hero-thumb-${item.slug || item.id}-${idx}`}
                type="button"
                className={`hero-thumb-btn ${isActive ? "active" : ""}`}
                onClick={() => setCurrentIndex(idx)}
                aria-label={`Chuyển sang phim ${item.title}`}
              >
                <div className="hero-thumb-img-wrap">
                  <img
                    src={thumbImg}
                    alt={item.title}
                    loading="lazy"
                  />
                  {isActive && (
                    <div className="hero-thumb-progress-track">
                      <div 
                        className={`hero-thumb-progress-bar ${!isPaused ? "running" : "paused"}`}
                        key={`progress-${currentIndex}`}
                        style={{ animationDuration: `${intervalMs}ms` }}
                      />
                    </div>
                  )}
                </div>
                <span className="hero-thumb-title" title={item.title}>
                  {item.title}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
