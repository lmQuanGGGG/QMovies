"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Bookmark, Check, Play, Star, Film } from "lucide-react";
import { Media } from "@/types/movie";
import { useApp } from "@/components/providers";
import { Card3D } from "@/components/ui/card-3d";

const DEFAULT_POSTER_FALLBACK =
  "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=85";

export function MovieCard({ media }: { media: Media }) {
  const { isSaved, toggleWatchlist, getHistory } = useApp();
  const mediaKey = media.slug || media.id;
  const historyItem = getHistory(mediaKey);

  // Link đến trang chi tiết phim
  const href = `/${media.mediaType === "tv" ? "tv" : "movie"}/${mediaKey}`;
  
  const year = media.releaseDate
    ? (new Date(media.releaseDate).getFullYear() || media.releaseDate.slice(0, 4))
    : "";

  const progress = historyItem ? historyItem.percentage : media.progress;

  const [imgSrc, setImgSrc] = useState(media.posterPath || DEFAULT_POSTER_FALLBACK);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setImgSrc(media.posterPath || DEFAULT_POSTER_FALLBACK);
    setHasError(false);
  }, [media.posterPath]);

  const handleImageError = () => {
    if (!hasError) {
      setHasError(true);
      setImgSrc(DEFAULT_POSTER_FALLBACK);
    }
  };

  return (
    <article className="movie-card">
      <Card3D maxTilt={12}>
        {/* Bấm vào poster chuyển hướng trực tiếp đến trang chi tiết phim */}
        <Link href={href} className="poster" aria-label={`Xem chi tiết phim ${media.title}`}>
          <Image
            src={imgSrc}
            alt={media.title}
            fill
            sizes="(max-width: 640px) 45vw, (max-width: 1024px) 25vw, 215px"
            unoptimized
            onError={handleImageError}
          />
          {hasError && (
            <div className="poster-fallback-overlay">
              <Film size={26} className="poster-fallback-icon" />
              <span className="poster-fallback-title">{media.title}</span>
            </div>
          )}
          <div className="poster-actions">
            <span className="round-action" aria-label={`Xem chi tiết ${media.title}`}>
              <Play size={16} fill="currentColor" />
            </span>
            <button
              type="button"
              className="round-action"
              aria-label="Lưu vào danh sách xem"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleWatchlist(media);
              }}
            >
              {isSaved(media.id) ? <Check size={16} /> : <Bookmark size={16} />}
            </button>
          </div>
          {media.episodeCurrent && (
            <span
              style={{
                position: "absolute",
                top: 6,
                left: 6,
                background: "rgba(0,0,0,0.75)",
                backdropFilter: "blur(4px)",
                color: "#fff",
                fontSize: 10,
                fontWeight: 600,
                padding: "2px 6px",
                borderRadius: 4,
                zIndex: 3,
              }}
            >
              {media.episodeCurrent}
            </span>
          )}
          {progress && progress > 0 ? (
            <span
              className="card-progress"
              style={{ width: `${Math.max(5, Math.min(100, progress))}%`, zIndex: 3 }}
            />
          ) : null}
        </Link>
      </Card3D>
      {/* Bấm vào thông tin tên phim cũng chuyển hướng đến trang chi tiết phim */}
      <Link href={href} className="movie-meta" title={media.title}>
        <strong>{media.title}</strong>
        <span>
          {year ? `${year} • ` : ""}
          <Star size={12} fill="currentColor" /> {media.voteAverage ? media.voteAverage.toFixed(1) : "8.0"}
          {media.lang && ` • ${media.lang}`}
        </span>
      </Link>
    </article>
  );
}
