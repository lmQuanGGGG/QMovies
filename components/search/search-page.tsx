"use client";

import { useEffect, useState, useTransition } from "react";
import { Clock3, Loader2, Search, X, Globe, Calendar, RotateCcw, Sparkles } from "lucide-react";
import { allMedia } from "@/lib/mock-data";
import { MovieCard } from "@/components/movie/movie-card";
import { Media } from "@/types/movie";

const COUNTRIES = [
  { label: "Tất cả quốc gia", value: "" },
  { label: "Hàn Quốc", value: "han-quoc" },
  { label: "Trung Quốc", value: "trung-quoc" },
  { label: "Âu Mỹ", value: "au-my" },
  { label: "Việt Nam", value: "viet-nam" },
  { label: "Nhật Bản", value: "nhat-ban" },
  { label: "Thái Lan", value: "thai-lan" },
  { label: "Ấn Độ", value: "an-do" },
  { label: "Hồng Kông", value: "hong-kong" },
  { label: "Đài Loan", value: "dai-loan" },
];

const YEARS = [
  { label: "Tất cả năm", value: "" },
  { label: "2026", value: "2026" },
  { label: "2025", value: "2025" },
  { label: "2024", value: "2024" },
  { label: "2023", value: "2023" },
  { label: "2022", value: "2022" },
  { label: "2021", value: "2021" },
  { label: "2020", value: "2020" },
  { label: "2019", value: "2019" },
  { label: "2018", value: "2018" },
];

export function SearchPage() {
  const [query, setQuery] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [results, setResults] = useState<Media[]>([]);
  const [loading, setLoading] = useState(false);

  const hasFilter = Boolean(query.trim() || selectedCountry || selectedYear);

  useEffect(() => {
    if (!hasFilter) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const params = new URLSearchParams();
        if (query.trim()) params.set("q", query.trim());
        if (selectedCountry) params.set("country", selectedCountry);
        if (selectedYear) params.set("year", selectedYear);

        const res = await fetch(`/api/search?${params.toString()}`);
        if (res.ok) {
          const data: Media[] = await res.json();
          if (data.length > 0) {
            setResults(data);
          } else {
            // Tìm kiếm dự phòng trong mock data nếu API không có
            let fallback = allMedia;
            if (query.trim()) {
              fallback = fallback.filter((item) =>
                item.title.toLowerCase().includes(query.toLowerCase())
              );
            }
            if (selectedYear) {
              fallback = fallback.filter(
                (item) => item.releaseDate && item.releaseDate.startsWith(selectedYear)
              );
            }
            setResults(fallback);
          }
        }
      } catch (e) {
        console.error("Search error:", e);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, selectedCountry, selectedYear, hasFilter]);

  const handleResetFilters = () => {
    setQuery("");
    setSelectedCountry("");
    setSelectedYear("");
  };

  const selectedCountryLabel = COUNTRIES.find((c) => c.value === selectedCountry)?.label;

  return (
    <main className="page-shell search-page">
      <div className="page-intro">
        <p className="eyebrow">Khám phá kho phim</p>
        <h1>Tìm kiếm phim</h1>
      </div>

      {/* Ô tìm kiếm chính */}
      <div className="large-search">
        <Search size={23} />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Nhập tên phim, diễn viên hoặc từ khóa..."
        />
        {loading && <Loader2 size={19} className="animate-spin" />}
        {query && !loading && (
          <button onClick={() => setQuery("")} aria-label="Xóa tìm kiếm">
            <X size={19} />
          </button>
        )}
      </div>

      {/* Bộ lọc chọn theo Quốc gia & Năm phát hành */}
      <div className="search-filter-section">
        {/* Hàng chọn Quốc gia */}
        <div className="filter-group">
          <div className="filter-label">
            <Globe size={14} />
            <span>Quốc gia</span>
          </div>
          <div className="filter-chips">
            {COUNTRIES.map((c) => (
              <button
                key={c.value || "all-country"}
                type="button"
                className={`filter-chip ${selectedCountry === c.value ? "active" : ""}`}
                onClick={() => setSelectedCountry((prev) => (prev === c.value ? "" : c.value))}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Hàng chọn Năm phát hành */}
        <div className="filter-group">
          <div className="filter-label">
            <Calendar size={14} />
            <span>Năm phát hành</span>
          </div>
          <div className="filter-chips">
            {YEARS.map((y) => (
              <button
                key={y.value || "all-year"}
                type="button"
                className={`filter-chip ${selectedYear === y.value ? "active" : ""}`}
                onClick={() => setSelectedYear((prev) => (prev === y.value ? "" : y.value))}
              >
                {y.label}
              </button>
            ))}
          </div>
        </div>

        {/* Nút đặt lại bộ lọc */}
        {(selectedCountry || selectedYear) && (
          <div className="filter-actions">
            <button
              type="button"
              className="clear-filters-btn"
              onClick={() => {
                setSelectedCountry("");
                setSelectedYear("");
              }}
            >
              <RotateCcw size={13} />
              <span>Xóa bộ lọc năm & quốc gia</span>
            </button>
          </div>
        )}
      </div>

      {/* Kết quả tìm kiếm */}
      {hasFilter ? (
        <>
          <div className="search-status-bar">
            <p className="result-count">
              {loading ? (
                "Đang tìm kiếm..."
              ) : (
                <>
                  Tìm thấy <strong>{results.length}</strong> bộ phim
                  {query && <> cho từ khóa “<strong>{query}</strong>”</>}
                  {selectedCountry && <> • {selectedCountryLabel}</>}
                  {selectedYear && <> • Năm {selectedYear}</>}
                </>
              )}
            </p>
          </div>

          <div className="movie-grid">
            {results.map((media) => (
              <MovieCard key={media.slug || media.id} media={media} />
            ))}
          </div>

          {!loading && results.length === 0 && (
            <div className="empty-state" style={{ marginTop: 40 }}>
              <h2>Không tìm thấy phim phù hợp</h2>
              <p>Hãy thử tìm với tên tiếng Việt không dấu hoặc chọn quốc gia / năm khác.</p>
              <button
                type="button"
                onClick={handleResetFilters}
                style={{
                  marginTop: 16,
                  padding: "8px 18px",
                  background: "var(--accent)",
                  color: "#fff",
                  borderRadius: 8,
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                Xóa toàn bộ bộ lọc
              </button>
            </div>
          )}
        </>
      ) : (
        /* Trạng thái gợi ý khi chưa nhập tìm kiếm */
        <div className="search-empty">
          <div>
            <Sparkles size={18} />
            <span>Gợi ý tìm kiếm phổ biến</span>
          </div>
          <div className="recent-list">
            <button onClick={() => setQuery("Thập Tự Kiếm")}>Thập Tự Kiếm</button>
            <button onClick={() => setQuery("Dune")}>Dune</button>
            <button onClick={() => setQuery("Tây Du Ký")}>Tây Du Ký</button>
            <button onClick={() => setQuery("Thâm Uyên Vô Gian")}>Thâm Uyên Vô Gian</button>
            <button onClick={() => setQuery("Oppenheimer")}>Oppenheimer</button>
          </div>

          <div>
            <Clock3 size={18} />
            <span>Từ khóa thịnh hành</span>
          </div>
          <div className="recent-list">
            <button onClick={() => setQuery("Phim Chiếu Rạp")}>Phim Chiếu Rạp</button>
            <button onClick={() => setQuery("Hành Động")}>Hành Động</button>
            <button onClick={() => setQuery("Anime")}>Anime</button>
            <button onClick={() => { setSelectedCountry("han-quoc"); }}>Phim Hàn Quốc mới</button>
            <button onClick={() => { setSelectedYear("2026"); }}>Phim 2026</button>
          </div>
        </div>
      )}
    </main>
  );
}
