import { MovieRail } from "@/components/movie/movie-rail";
import { BookFlipRail } from "@/components/movie/book-flip-rail";
import { HeroCarousel } from "@/components/movie/hero-carousel";
import { Top10Rail } from "@/components/movie/top10-rail";
import { LandscapeRail } from "@/components/movie/landscape-rail";
import { SpotlightBoxRail } from "@/components/movie/spotlight-box-rail";
import { ContinueWatchingRail } from "@/components/movie/continue-watching-rail";
import { 
  getPhimChieuRap,
  getPhimMoiCapNhat, 
  getPhimLe, 
  getPhimBo, 
  getHoatHinh, 
  getTVShows,
  getPhimByTheLoai,
  getPhimByQuocGia 
} from "@/lib/phimapi";

export default async function HomePage() {
  const [
    phimChieuRap2026Res,
    phimChieuRapRes,
    phimMoiRes, 
    phimLeRes, 
    phimBoRes, 
    vietnamRes,
    trungQuocRes,
    koreanRes,
    hanhDongRes, 
    coTrangRes, 
    hoatHinhRes, 
    tvShowsRes
  ] = await Promise.all([
    getPhimChieuRap(1, 16, 2026),
    getPhimChieuRap(1, 24),
    getPhimMoiCapNhat(1),
    getPhimLe(1, 16, 2026),
    getPhimBo(1, 16, 2026),
    getPhimByQuocGia("viet-nam", 1, 16, 2026),
    getPhimByQuocGia("trung-quoc", 1, 16, 2026),
    getPhimByQuocGia("han-quoc", 1, 16, 2026),
    getPhimByTheLoai("hanh-dong", 1, 16, 2026),
    getPhimByTheLoai("co-trang", 1, 16, 2026),
    getHoatHinh(1, 16),
    getTVShows(1, 16),
  ]);

  // Phim bom tấn rạp mới nhất (2025 - 2026) cho Hero Banner & Top 10
  const chieuRap2026 = phimChieuRap2026Res.items;
  const chieuRapAll = phimChieuRapRes.items.filter(m => Number(m.releaseDate?.slice(0, 4) || 0) >= 2025);
  const blockbusters = chieuRap2026.length >= 5 ? chieuRap2026 : chieuRapAll;

  // 5 phim tiêu điểm trên Hero: 100% phim chiếu rạp bom tấn mới nhất
  const featuredMovies = blockbusters.slice(0, 5);

  // Top 10 phim chiếu rạp hot nhất 2025-2026 với hiệu ứng 3D & thứ hạng 1..10
  const top10List = blockbusters.length >= 10 
    ? blockbusters.slice(0, 10) 
    : [...chieuRap2026, ...chieuRapAll].filter((m, i, arr) => arr.findIndex(x => x.slug === m.slug) === i).slice(0, 10);

  // Lọc danh sách phim mới cập nhật: loại bỏ phim cũ rích do server re-upload, ưu tiên 2024-2026
  const phimMoiLoc = phimMoiRes.items.filter(m => Number(m.releaseDate?.slice(0, 4) || 0) >= 2024);
  const phimMoi = phimMoiLoc.length >= 8 ? phimMoiLoc : phimMoiRes.items;

  const phimLe = phimLeRes.items;
  const phimBo = phimBoRes.items;
  const vietnam = vietnamRes.items;
  const trungQuoc = trungQuocRes.items;
  const korean = koreanRes.items;
  const hanhDong = hanhDongRes.items;
  const coTrang = coTrangRes.items;
  const hoatHinh = hoatHinhRes.items;
  const tvShows = tvShowsRes.items;

  return (
    <main>
      {/* Banner tiêu điểm tự nhảy 5 phim bom tấn rạp mới nhất 2026 */}
      <HeroCarousel items={featuredMovies} intervalMs={5000} />

      <div className="home-content">
        {/* Mục Tiếp tục xem (tự động xuất hiện khi có lịch sử xem phim dở dang) */}
        <ContinueWatchingRail />

        {/* KIỂU 1: Top 10 phim bom tấn chiếu rạp hot nhất (với hiệu ứng thẻ bài 3D và số thứ hạng 1, 2, 3...) */}
        <Top10Rail 
          title="Top 10 phim chiếu rạp hot nhất" 
          items={top10List.length >= 10 ? top10List : phimLe} 
          href="/movies" 
        />

        {/* KIỂU 3: Spotlight Box riêng cho Phim Hàn Quốc */}
        <SpotlightBoxRail 
          title="Điện ảnh Hàn Quốc" 
          subtitle="Xem toàn bộ" 
          items={korean.length > 0 ? korean : phimBo} 
          href="/movies?country=han-quoc" 
        />

        {/* KIỂU 2: Dấu ấn điện ảnh Việt (Landscape card với mini poster đè góc) */}
        <LandscapeRail 
          title="Dấu ấn điện ảnh Việt" 
          items={vietnam.length > 0 ? vietnam : phimLe.slice(0, 6)} 
          href="/movies?country=viet-nam" 
        />

        {/* Phim Trung Quốc (Điện ảnh & Cổ trang Hoa Ngữ) */}
        <SpotlightBoxRail 
          title="Điện ảnh Trung Quốc" 
          subtitle="Xem tất cả phim Trung" 
          items={trungQuoc.length > 0 ? trungQuoc : coTrang} 
          href="/movies?country=trung-quoc" 
        />

        {/* Phim bom tấn chiếu rạp - Cuốn sách 3D lật trang */}
        <BookFlipRail 
          title="Phim bom tấn chiếu rạp mới nhất" 
          items={blockbusters} 
          href="/movies" 
        />

        {/* Dải phim Cổ Trang & Thần Thoại */}
        <MovieRail 
          title="Phim cổ trang - Thần thoại" 
          items={coTrang} 
          href="/movies?genre=co-trang" 
        />

        {/* Các dải phim phong phú khác */}
        <MovieRail title="Phim vừa cập nhật hôm nay" items={phimMoi} href="/trending" />
        <MovieRail title="Phim bộ nổi bật" items={phimBo} href="/tv" />
        {hanhDong.length > 0 && (
          <MovieRail title="Phim hành động kịch tính" items={hanhDong} href="/movies?genre=hanh-dong" />
        )}
        {hoatHinh.length > 0 && (
          <MovieRail title="Hoạt hình & Anime đỉnh cao" items={hoatHinh} href="/movies?genre=hoat-hinh" />
        )}
        {tvShows.length > 0 && (
          <MovieRail title="Chương trình truyền hình (TV Shows)" items={tvShows} />
        )}
      </div>
    </main>
  );
}
