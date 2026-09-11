import { getPhimBo, getPhimByTheLoai, getPhimByQuocGia } from "@/lib/phimapi";
import { Explore } from "@/components/movie/explore";

export default async function TVPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; genre?: string; country?: string; year?: string }>;
}) {
  const { page, genre, country, year } = await searchParams;
  const pageNum = Number(page) || 1;
  const yearNum = year ? Number(year) : undefined;

  let result;
  let title = "Phim bộ nổi bật";

  if (genre) {
    result = await getPhimByTheLoai(genre, pageNum, 24, yearNum);
    title = "Phim bộ theo thể loại";
  } else if (country) {
    result = await getPhimByQuocGia(country, pageNum, 24, yearNum);
    title = "Phim truyền hình theo quốc gia";
  } else {
    result = await getPhimBo(pageNum, 24, yearNum);
  }

  return (
    <Explore
      title={title}
      items={result.items}
      pagination={result.pagination}
      currentGenre={genre}
      currentCountry={country}
      currentYear={year}
      baseHref="/tv"
    />
  );
}
