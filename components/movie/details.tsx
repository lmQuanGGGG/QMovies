"use client";

import Image from "next/image";
import Link from "next/link";
import { Bookmark, Check, Clock3, Film, Play, Star } from "lucide-react";
import { useApp } from "@/components/providers";
import { Media, genres } from "@/types/movie";

export function DetailHero({ media }: { media: Media }) {
  const { isSaved, toggleWatchlist, getHistory } = useApp();
  const mediaKey = media.slug || media.id;
  const historyItem = getHistory(mediaKey);
  
  const watchHref = historyItem
    ? (media.mediaType === "tv"
        ? `/watch/tv/${mediaKey}/1/${(historyItem.episodeIdx ?? 0) + 1}`
        : `/watch/movie/${mediaKey}`)
    : `/watch/${media.mediaType}/${mediaKey}${media.mediaType === "tv" ? "/1/1" : ""}`;
  
  const year = media.releaseDate
    ? (new Date(media.releaseDate).getFullYear() || media.releaseDate.slice(0, 4))
    : "";

  const genreLabels = media.genres && media.genres.length > 0
    ? media.genres
    : media.genreIds.map((id) => genres[id] ?? "Phim");

  return (
    <>
      <section 
        className="detail-hero" 
        style={{ backgroundImage: `url(${media.backdropPath})` }}
      >
        <div className="detail-veil" />
      </section>
      <main className="detail-content">
        <div className="detail-poster">
          <Image 
            src={media.posterPath} 
            fill 
            alt={media.title} 
            sizes="(max-width: 640px) 44vw, 280px"
            unoptimized
          />
        </div>
        <div className="detail-copy">
          <p className="eyebrow">
            {media.mediaType === "tv" ? "Phim bộ truyền hình" : "Phim điện ảnh / Phim lẻ"}
          </p>
          <h1>{media.title}</h1>
          {media.originalTitle && media.originalTitle !== media.title && (
            <p className="original-title">{media.originalTitle}</p>
          )}
          <div className="facts">
            <span>
              <Star size={15} fill="currentColor" /> {media.voteAverage ? media.voteAverage.toFixed(1) : "8.0"}
            </span>
            {year && <span>{year}</span>}
            {media.runtime && (
              <span>
                <Clock3 size={15} /> {media.runtime} phút
              </span>
            )}
            {media.quality && (
              <span style={{ background: "rgba(255,255,255,0.15)", padding: "2px 6px", borderRadius: 4 }}>
                {media.quality}
              </span>
            )}
            {media.lang && (
              <span style={{ background: "rgba(233,58,51,0.2)", color: "var(--accent)", padding: "2px 6px", borderRadius: 4, fontWeight: 600 }}>
                {media.lang}
              </span>
            )}
          </div>
          <div className="genre-list">
            {genreLabels.map((g, idx) => (
              <span key={`${g}-${idx}`}>{g}</span>
            ))}
          </div>
          <p className="overview">{media.overview}</p>
          <div className="cta-row">
            <Link className="button primary" href={watchHref}>
              <Play size={18} fill="currentColor" /> {historyItem ? `Tiếp tục xem ${historyItem.episodeName ? `(${historyItem.episodeName})` : ""}` : "Xem ngay"}
            </Link>
            <button 
              className="button secondary" 
              onClick={() => toggleWatchlist(media)}
            >
              {isSaved(media.id) ? <Check size={18} /> : <Bookmark size={18} />}
              {isSaved(media.id) ? "Đã lưu" : "Thêm vào danh sách"}
            </button>
          </div>
        </div>
      </main>
    </>
  );
}
