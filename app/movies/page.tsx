import { getPhimLe, getPhimByTheLoai, getPhimByQuocGia } from "@/lib/phimapi";
import { Explore } from "@/components/movie/explore";

export default async function MoviesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; genre?: string; country?: string; year?: string }>;
}) {
  const { page, genre, country, year } = await searchParams;
  const pageNum = Number(page) || 1;
  const yearNum = year ? Number(year) : undefined;

  let result;
  let title = "Phim lẻ đặc sắc";

  if (genre) {
    result = await getPhimByTheLoai(genre, pageNum, 24, yearNum);
    title = "Phim lẻ theo thể loại";
  } else if (country) {
    result = await getPhimByQuocGia(country, pageNum, 24, yearNum);
    title = "Phim điện ảnh theo quốc gia";
  } else {
    result = await getPhimLe(pageNum, 24, yearNum);
  }

  return (
    <Explore
      title={title}
      items={result.items}
      pagination={result.pagination}
      currentGenre={genre}
      currentCountry={country}
      currentYear={year}
      baseHref="/movies"
    />
  );
}
