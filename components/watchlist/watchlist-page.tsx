"use client";
import { Bookmark } from "lucide-react";
import { useApp } from "@/components/providers";
import { MovieCard } from "@/components/movie/movie-card";
export function WatchlistPage() { const { watchlist } = useApp(); return <main className="page-shell"><div className="page-intro"><p className="eyebrow">Bộ sưu tập của bạn</p><h1>Danh sách xem</h1><p>Lưu lại những bộ phim bạn muốn thưởng thức sau.</p></div>{watchlist.length ? <div className="movie-grid">{watchlist.map((media) => <MovieCard key={media.slug || media.id} media={media}/>)}</div> : <div className="empty-state"><Bookmark size={28}/><h2>Danh sách đang trống</h2><p>Nhấn vào biểu tượng dấu trang ở bất kỳ phim nào để lưu vào đây.</p></div>}</main>; }
