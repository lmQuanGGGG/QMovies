import Link from "next/link";
import { ChevronLeft, ChevronRight, Filter } from "lucide-react";
import { Media } from "@/types/movie";
import { MovieCard } from "@/components/movie/movie-card";
import { PaginationInfo } from "@/lib/phimapi";

interface ExploreProps {
  title: string;
  items: Media[];
  pagination?: PaginationInfo;
  currentGenre?: string;
  currentCountry?: string;
  currentYear?: string;
  baseHref?: string;
}

const GENRE_FILTERS = [
  { label: "Tất cả thể loại", value: "" },
  { label: "Hành Động", value: "hanh-dong" },
  { label: "Cổ Trang", value: "co-trang" },
  { label: "Tình Cảm", value: "tinh-cam" },
  { label: "Viễn Tưởng", value: "vien-tuong" },
  { label: "Kinh Dị", value: "kinh-di" },
  { label: "Hài Hước", value: "hai-huoc" },
  { label: "Hoạt Hình", value: "hoat-hinh" },
];

const COUNTRY_FILTERS = [
  { label: "Tất cả quốc gia", value: "" },
  { label: "Hàn Quốc", value: "han-quoc" },
  { label: "Trung Quốc", value: "trung-quoc" },
  { label: "Âu Mỹ", value: "au-my" },
  { label: "Việt Nam", value: "viet-nam" },
  { label: "Nhật Bản", value: "nhat-ban" },
  { label: "Thái Lan", value: "thai-lan" },
  { label: "Ấn Độ", value: "an-do" },
  { label: "Hồng Kông", value: "hong-kong" },
];

const YEAR_FILTERS = [
  { label: "Tất cả năm", value: "" },
  { label: "2026", value: "2026" },
  { label: "2025", value: "2025" },
  { label: "2024", value: "2024" },
  { label: "2023", value: "2023" },
  { label: "2022", value: "2022" },
  { label: "2021", value: "2021" },
  { label: "2020", value: "2020" },
];

export function Explore({
  title,
  items,
  pagination,
  currentGenre = "",
  currentCountry = "",
  currentYear = "",
  baseHref = "/movies",
}: ExploreProps) {
  const currentPage = pagination?.currentPage || 1;
  const totalPages = pagination?.totalPages || 1;
  const totalItems = pagination?.totalItems || items.length;

  const buildPageUrl = (page: number, genre = currentGenre, country = currentCountry, year = currentYear) => {
    const params = new URLSearchParams();
    if (page > 1) params.set("page", String(page));
    if (genre) params.set("genre", genre);
    if (country) params.set("country", country);
    if (year) params.set("year", year);
    const query = params.toString();
    return query ? `${baseHref}?${query}` : baseHref;
  };

  // Tạo các số trang hiển thị
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;
    
    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + maxVisible - 1);
    
    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }

    if (start > 1) {
      pages.push(1);
      if (start > 2) pages.push("...");
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (end < totalPages) {
      if (end < totalPages - 1) pages.push("...");
      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <main className="page-shell">
      <div className="page-intro">
        <p className="eyebrow">Khám phá kho phim</p>
        <h1>{title}</h1>
        <p>
          Hơn <strong>{totalItems.toLocaleString("vi-VN")}</strong> bộ phim chọn lọc với chất lượng Full HD, cập nhật liên tục mỗi ngày.
        </p>
      </div>

      {/* Bộ lọc Thể loại, Quốc gia và Năm */}
      <div className="explore-filters-box" style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 26 }}>
        {/* Thể loại */}
        <div className="filter-row" style={{ padding: "0 0 4px" }}>
          {GENRE_FILTERS.map((filter) => {
            const isActive = (!filter.value && !currentGenre) || currentGenre === filter.value;
            const href = buildPageUrl(1, filter.value, currentCountry, currentYear);
            return (
              <Link
                key={`genre-${filter.label}`}
                href={href}
                className={`filter-pill ${isActive ? "active" : ""}`}
              >
                {filter.label}
              </Link>
            );
          })}
        </div>

        {/* Quốc gia */}
        <div className="filter-row" style={{ padding: "0 0 4px" }}>
          {COUNTRY_FILTERS.map((filter) => {
            const isActive = (!filter.value && !currentCountry) || currentCountry === filter.value;
            const href = buildPageUrl(1, currentGenre, filter.value, currentYear);
            return (
              <Link
                key={`country-${filter.label}`}
                href={href}
                className={`filter-pill ${isActive ? "active" : ""}`}
              >
                {filter.label}
              </Link>
            );
          })}
        </div>

        {/* Năm phát hành */}
        <div className="filter-row" style={{ padding: "0 0 4px" }}>
          {YEAR_FILTERS.map((filter) => {
            const isActive = (!filter.value && !currentYear) || currentYear === filter.value;
            const href = buildPageUrl(1, currentGenre, currentCountry, filter.value);
            return (
              <Link
                key={`year-${filter.label}`}
                href={href}
                className={`filter-pill ${isActive ? "active" : ""}`}
              >
                {filter.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Danh sách phim */}
      {items.length > 0 ? (
        <div className="movie-grid">
          {items.map((media) => (
            <MovieCard key={media.slug || media.id} media={media} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h2>Chưa có phim cho bộ lọc này</h2>
          <p>Vui lòng thử chọn thể loại hoặc quốc gia khác.</p>
        </div>
      )}

      {/* Thanh phân trang */}
      {totalPages > 1 && (
        <div className="pagination-wrapper">
          <div className="pagination-bar">
            {currentPage > 1 ? (
              <Link
                href={buildPageUrl(currentPage - 1)}
                className="pagination-btn nav-btn"
                aria-label="Trang trước"
              >
                <ChevronLeft size={17} /> Trang trước
              </Link>
            ) : (
              <span className="pagination-btn nav-btn disabled">
                <ChevronLeft size={17} /> Trang trước
              </span>
            )}

            <div className="pagination-numbers">
              {getPageNumbers().map((p, idx) => {
                if (p === "...") {
                  return <span key={`ellipsis-${idx}`} className="pagination-dots">...</span>;
                }
                const pageNum = p as number;
                const isCurrent = pageNum === currentPage;
                return (
                  <Link
                    key={`page-${pageNum}`}
                    href={buildPageUrl(pageNum)}
                    className={`pagination-btn num-btn ${isCurrent ? "active" : ""}`}
                  >
                    {pageNum}
                  </Link>
                );
              })}
            </div>

            {currentPage < totalPages ? (
              <Link
                href={buildPageUrl(currentPage + 1)}
                className="pagination-btn nav-btn"
                aria-label="Trang sau"
              >
                Trang sau <ChevronRight size={17} />
              </Link>
            ) : (
              <span className="pagination-btn nav-btn disabled">
                Trang sau <ChevronRight size={17} />
              </span>
            )}
          </div>
          <div className="pagination-info">
            Trang {currentPage} / {totalPages} (Hiển thị {items.length} phim trong tổng số {totalItems.toLocaleString("vi-VN")} phim)
          </div>
        </div>
      )}
    </main>
  );
}
