"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ChevronLeft, 
  ChevronRight, 
  Play, 
  Star, 
  ArrowUpRight,
  Film
} from "lucide-react";
import { Media } from "@/types/movie";

interface BookFlipRailProps {
  title?: string;
  items: Media[];
  href?: string;
}

export function BookFlipRail({
  title = "Phim bom tấn chiếu rạp mới nhất",
  items = [],
  href = "/movies",
}: BookFlipRailProps) {
  const router = useRouter();

  // Mỗi lượt mở sách (spread) hiển thị 6 phim (3 phim trang trái, 3 phim trang phải)
  const ITEMS_PER_PAGE = 3;
  const ITEMS_PER_SPREAD = 6;
  
  // Danh sách phim bom tấn
  const validItems = items.length > 0 ? items : [];
  const totalSpreads = Math.max(1, Math.ceil(validItems.length / ITEMS_PER_SPREAD));

  const [currentSpread, setCurrentSpread] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipDirection, setFlipDirection] = useState<"next" | "prev" | null>(null);
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  // Chuyển sang trang tiếp theo (Lật sang trang tiếp theo)
  const handleNextPage = useCallback(() => {
    if (isFlipping || totalSpreads <= 1) return;
    setFlipDirection("next");
    setIsFlipping(true);
    setTimeout(() => {
      setCurrentSpread((prev) => (prev + 1) % totalSpreads);
      setIsFlipping(false);
      setFlipDirection(null);
    }, 650);
  }, [totalSpreads, isFlipping]);

  // Chuyển về trang trước (Lật về trang trước)
  const handlePrevPage = useCallback(() => {
    if (isFlipping || totalSpreads <= 1) return;
    setFlipDirection("prev");
    setIsFlipping(true);
    setTimeout(() => {
      setCurrentSpread((prev) => (prev - 1 + totalSpreads) % totalSpreads);
      setIsFlipping(false);
      setFlipDirection(null);
    }, 650);
  }, [totalSpreads, isFlipping]);

  // Tự động lật trang (Auto-flip timer, tạm dừng khi người dùng hover chuột vào sách)
  useEffect(() => {
    if (!isAutoPlay || isHovered || isFlipping || totalSpreads <= 1) return;

    const timer = setInterval(() => {
      if (typeof document !== "undefined" && document.hidden) return;
      handleNextPage();
    }, 5200);

    return () => clearInterval(timer);
  }, [isAutoPlay, isHovered, isFlipping, totalSpreads, handleNextPage]);

  // Điều khiển bằng phím mũi tên bàn phím
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight" || e.key === "ArrowDown") handleNextPage();
    if (e.key === "ArrowLeft" || e.key === "ArrowUp") handlePrevPage();
  };

  // Quản lý vuốt chạm (Touch swipe / Drag)
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const isDragging = useRef(false);

  // Cử chỉ chạm vuốt (Touch Swipe)
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isDragging.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const diffX = e.touches[0].clientX - touchStartX.current;
    const diffY = e.touches[0].clientY - touchStartY.current;
    if (Math.abs(diffX) > 12 || Math.abs(diffY) > 12) isDragging.current = true;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const diffX = e.changedTouches[0].clientX - touchStartX.current;
    const diffY = e.changedTouches[0].clientY - touchStartY.current;

    // Trên điện thoại, ưu tiên cử chỉ vuốt dọc (vuốt lên lật tiếp, vuốt xuống lật lùi) hoặc vuốt ngang
    if (Math.abs(diffY) > Math.abs(diffX) && Math.abs(diffY) > 35) {
      if (diffY < -35) handleNextPage();
      else if (diffY > 35) handlePrevPage();
    } else if (Math.abs(diffX) > 35) {
      if (diffX < -35) handleNextPage();
      else if (diffX > 35) handlePrevPage();
    }
    touchStartX.current = null;
    touchStartY.current = null;
    setTimeout(() => { isDragging.current = false; }, 60);
  };

  // Cử chỉ kéo chuột trên máy tính (Mouse Drag)
  const handleMouseDown = (e: React.MouseEvent) => {
    touchStartX.current = e.clientX;
    touchStartY.current = e.clientY;
    isDragging.current = false;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const diffX = e.clientX - touchStartX.current;
    const diffY = e.clientY - touchStartY.current;
    if (Math.abs(diffX) > 12 || Math.abs(diffY) > 12) {
      isDragging.current = true;
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const diffX = e.clientX - touchStartX.current;
    const diffY = e.clientY - touchStartY.current;

    if (Math.abs(diffY) > Math.abs(diffX) && Math.abs(diffY) > 35) {
      if (diffY < -35) handleNextPage();
      else if (diffY > 35) handlePrevPage();
    } else if (Math.abs(diffX) > 35) {
      if (diffX < -35) handleNextPage();
      else if (diffX > 35) handlePrevPage();
    }
    touchStartX.current = null;
    touchStartY.current = null;
    setTimeout(() => { isDragging.current = false; }, 60);
  };

  if (validItems.length === 0) return null;

  // Tính toán dữ liệu phim cho lượt mở sách hiện tại (Current Spread)
  const leftStartIndex = currentSpread * ITEMS_PER_SPREAD;
  const rightStartIndex = leftStartIndex + ITEMS_PER_PAGE;
  const currentLeftMovies = validItems.slice(leftStartIndex, leftStartIndex + ITEMS_PER_PAGE);
  const currentRightMovies = validItems.slice(rightStartIndex, rightStartIndex + ITEMS_PER_PAGE);

  // Tính toán dữ liệu phim cho lượt mở sách tiếp theo (Next Spread)
  const nextSpreadIdx = (currentSpread + 1) % totalSpreads;
  const nextLeftStartIndex = nextSpreadIdx * ITEMS_PER_SPREAD;
  const nextRightStartIndex = nextLeftStartIndex + ITEMS_PER_PAGE;
  const nextLeftMovies = validItems.slice(nextLeftStartIndex, nextLeftStartIndex + ITEMS_PER_PAGE);
  const nextRightMovies = validItems.slice(nextRightStartIndex, nextRightStartIndex + ITEMS_PER_PAGE);

  // Tính toán dữ liệu phim cho lượt mở sách trước đó (Prev Spread)
  const prevSpreadIdx = (currentSpread - 1 + totalSpreads) % totalSpreads;
  const prevLeftStartIndex = prevSpreadIdx * ITEMS_PER_SPREAD;
  const prevRightStartIndex = prevLeftStartIndex + ITEMS_PER_PAGE;
  const prevLeftMovies = validItems.slice(prevLeftStartIndex, prevLeftStartIndex + ITEMS_PER_PAGE);
  const prevRightMovies = validItems.slice(prevRightStartIndex, prevRightStartIndex + ITEMS_PER_PAGE);

  const leftPageNum = currentSpread * 2 + 1;
  const rightPageNum = currentSpread * 2 + 2;
  const totalPages = totalSpreads * 2;

  // Hàm render danh sách 3 phim trong một trang sách
  const renderPageMovies = (movies: Media[], isPreview = false) => {
    return (
      <div className="book-page-grid">
        {movies.map((media, idx) => {
          const mediaKey = media.slug || media.id;
          const detailHref = `/${media.mediaType === "tv" ? "tv" : "movie"}/${mediaKey}`;
          const rating = media.voteAverage ? media.voteAverage.toFixed(1) : "8.5";

          return (
            <div 
              key={`book-movie-${mediaKey}-${idx}`} 
              className="book-movie-item"
              onClick={(e) => {
                if (isDragging.current || isPreview) {
                  e.preventDefault();
                  return;
                }
                router.push(detailHref);
              }}
            >
              <div className="book-movie-poster-wrap">
                <img
                  src={media.posterPath || media.backdropPath}
                  alt={media.title}
                  loading="lazy"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src =
                      "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=85";
                  }}
                />
                
                {/* Huy hiệu chất lượng */}
                <div className="book-movie-badges">
                  <span className="book-badge-full">Full</span>
                  {media.mediaType === "tv" && (
                    <span className="book-badge-sub">PĐ</span>
                  )}
                </div>

                {/* Điểm đánh giá */}
                <div className="book-movie-rating">
                  <Star size={11} fill="currentColor" /> {rating}
                </div>

                {/* Overlay Play khi rê chuột */}
                <div className="book-movie-play-overlay">
                  <div className="book-play-circle">
                    <Play size={20} fill="#fff" />
                  </div>
                </div>
              </div>

              {/* Thông tin phim */}
              <div className="book-movie-info">
                <h4 className="book-movie-title" title={media.title}>
                  {media.title}
                </h4>
                <div className="book-movie-meta">
                  <span>{media.releaseDate ? new Date(media.releaseDate).getFullYear() : 2026}</span>
                  <span className="meta-sep">•</span>
                  <span>{media.lang === "vi" ? "Việt Nam" : (media.lang || "Vietsub")}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <section 
      className="book-showcase-section"
      onKeyDown={handleKeyDown}
      tabIndex={0}
      aria-label={`Cuốn sách 3D ${title}`}
    >
      {/* Tiêu đề mục */}
      <div className="book-section-header">
        <div className="book-header-left">
          <h2>{title}</h2>
        </div>

        <div className="book-header-right">
          <Link href={href} className="book-view-all">
            Xem tất cả <ArrowUpRight size={15} />
          </Link>
        </div>
      </div>

      {/* KHÔNG GIAN CUỐN SÁCH 3D (3D OPEN BOOK STAGE) */}
      <div 
        className="book-3d-stage"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        {/* Nút lật trang nổi hai bên mép sách */}
        <button
          type="button"
          className="book-side-arrow prev"
          onClick={handlePrevPage}
          disabled={isFlipping}
          aria-label="Trang trước"
        >
          <ChevronLeft size={22} />
        </button>
        <button
          type="button"
          className="book-side-arrow next"
          onClick={handleNextPage}
          disabled={isFlipping}
          aria-label="Trang kế tiếp"
        >
          <ChevronRight size={22} />
        </button>

        {/* Khung bìa sách mở đôi (The Open Book) */}
        <div className="book-spread-container">
          
          {/* Lớp xếp giấy mô phỏng độ dày cuốn sách (Paper Thickness Edge Layers) */}
          <div className="book-edge-shadow left-edge" />
          <div className="book-edge-shadow right-edge" />
          <div className="book-bottom-pages" />

          {/* Dây ruy-băng đỏ kẹp trang (Bookmark Ribbon) */}
          <div className="book-ribbon-bookmark">
            <span className="ribbon-tail" />
          </div>

          {/* Rãnh gáy sách trung tâm (Center 3D Spine) */}
          <div className="book-spine-divider" />

          {/* ========================================================================= */}
          {/* CÁC LỚP TRANG GIẤY XẾP CHỒNG PHÍA SAU (STACKED PAGES UNDERNEATH)          */}
          {/* ========================================================================= */}
          <div className="book-page-stack left-page-stack" aria-hidden="true">
            <div className="stack-page page-depth-4" />
            <div className="stack-page page-depth-3" />
            <div className="stack-page page-depth-2" />
            <div className="stack-page page-depth-1" />
          </div>

          <div className="book-page-stack right-page-stack" aria-hidden="true">
            <div className="stack-page page-depth-4" />
            <div className="stack-page page-depth-3" />
            <div className="stack-page page-depth-2" />
            <div className="stack-page page-depth-1" />
          </div>

          {/* ========================================================================= */}
          {/* 1. TRANG TRÁI TĨNH (STATIC LEFT PAGE) */}
          {/* ========================================================================= */}
          <div 
            className="book-page book-page-left"
            onClick={(e) => {
              // Click góc ngoài trang trái để lật ngược lại
              const rect = e.currentTarget.getBoundingClientRect();
              if (e.clientX - rect.left < 80) handlePrevPage();
            }}
          >
            {/* Header đầu trang sách */}
            <div className="book-page-top-bar">
              <div className="page-chapter">
                <Film size={13} />
                <span>BOM TẤN CHIẾU RẠP</span>
              </div>
              <span className="page-vol">TẬP #{currentSpread + 1}</span>
            </div>

            {/* Nội dung 3 phim của trang trái */}
            {renderPageMovies(
              flipDirection === "prev" ? prevLeftMovies : currentLeftMovies
            )}

            {/* Chân trang với số trang */}
            <div className="book-page-bottom-bar">
              <span className="book-page-number">Trang {String(leftPageNum).padStart(2, "0")}</span>
              <span className="book-edition">QMOVIES SPECIAL EDITION</span>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 2. TRANG PHẢI TĨNH (STATIC RIGHT PAGE) */}
          {/* ========================================================================= */}
          <div 
            className="book-page book-page-right"
            onClick={(e) => {
              // Click góc ngoài trang phải để lật tiếp
              const rect = e.currentTarget.getBoundingClientRect();
              if (rect.right - e.clientX < 80) handleNextPage();
            }}
          >
            {/* Header đầu trang sách */}
            <div className="book-page-top-bar right-top-bar">
              <span className="page-vol">PHÒNG VÉ HOT NHẤT</span>
              <div className="page-chapter">
                <span>2026 TOP CHARTS</span>
                <Star size={13} fill="currentColor" />
              </div>
            </div>

            {/* Nội dung 3 phim của trang phải */}
            {renderPageMovies(
              flipDirection === "next" ? nextRightMovies : currentRightMovies
            )}

            {/* Chân trang với số trang & Góc uốn giấy (Dog-ear) */}
            <div className="book-page-bottom-bar right-bottom-bar">
              <span className="book-edition">BẢN QUYỀN ĐIỆN ẢNH</span>
              <span className="book-page-number">Trang {String(rightPageNum).padStart(2, "0")}</span>
            </div>

            {/* Góc lật trang phải */}
            <div 
              className="book-corner-curl right-curl" 
              onClick={handleNextPage}
              title="Bấm để lật sang trang sau"
            />
          </div>

          {/* ========================================================================= */}
          {/* 3. TỜ LẬT ĐỘNG 3D KHI CHUYỂN TRANG (ANIMATED FLIPPING LEAF) */}
          {/* ========================================================================= */}
          {isFlipping && (
            <div className={`book-flipping-leaf ${flipDirection === "next" ? "flip-forward" : "flip-backward"}`}>
              {/* MẶT TRƯỚC (FRONT FACE) */}
              <div className="leaf-face leaf-front">
                <div className="leaf-overlay-shadow" />
                {flipDirection === "next" ? (
                  <div className="book-page-top-bar right-top-bar">
                    <span className="page-vol">PHÒNG VÉ HOT NHẤT</span>
                    <div className="page-chapter">
                      <span>2026 TOP CHARTS</span>
                      <Star size={13} fill="currentColor" />
                    </div>
                  </div>
                ) : (
                  <div className="book-page-top-bar">
                    <div className="page-chapter">
                      <Film size={13} />
                      <span>BOM TẤN CHIẾU RẠP</span>
                    </div>
                    <span className="page-vol">TẬP #{currentSpread + 1}</span>
                  </div>
                )}

                {renderPageMovies(
                  flipDirection === "next" ? currentRightMovies : currentLeftMovies, 
                  true
                )}

                <div className={`book-page-bottom-bar ${flipDirection === "next" ? "right-bottom-bar" : ""}`}>
                  {flipDirection === "next" ? (
                    <>
                      <span className="book-edition">BẢN QUYỀN ĐIỆN ẢNH</span>
                      <span className="book-page-number">Trang {String(rightPageNum).padStart(2, "0")}</span>
                    </>
                  ) : (
                    <>
                      <span className="book-page-number">Trang {String(leftPageNum).padStart(2, "0")}</span>
                      <span className="book-edition">QMOVIES SPECIAL EDITION</span>
                    </>
                  )}
                </div>
              </div>

              {/* MẶT SAU (BACK FACE) */}
              <div className="leaf-face leaf-back">
                <div className="leaf-overlay-shadow back-shadow" />
                {flipDirection === "next" ? (
                  <div className="book-page-top-bar">
                    <div className="page-chapter">
                      <Film size={13} />
                      <span>BOM TẤN CHIẾU RẠP</span>
                    </div>
                    <span className="page-vol">TẬP #{nextSpreadIdx + 1}</span>
                  </div>
                ) : (
                  <div className="book-page-top-bar right-top-bar">
                    <span className="page-vol">PHÒNG VÉ HOT NHẤT</span>
                    <div className="page-chapter">
                      <span>2026 TOP CHARTS</span>
                      <Star size={13} fill="currentColor" />
                    </div>
                  </div>
                )}

                {renderPageMovies(
                  flipDirection === "next" ? nextLeftMovies : prevRightMovies, 
                  true
                )}

                <div className={`book-page-bottom-bar ${flipDirection === "next" ? "" : "right-bottom-bar"}`}>
                  {flipDirection === "next" ? (
                    <>
                      <span className="book-page-number">Trang {String(nextSpreadIdx * 2 + 1).padStart(2, "0")}</span>
                      <span className="book-edition">QMOVIES SPECIAL EDITION</span>
                    </>
                  ) : (
                    <>
                      <span className="book-edition">BẢN QUYỀN ĐIỆN ẢNH</span>
                      <span className="book-page-number">Trang {String(prevSpreadIdx * 2 + 2).padStart(2, "0")}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </section>
  );
}
