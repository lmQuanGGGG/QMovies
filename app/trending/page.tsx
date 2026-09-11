import { getPhimMoiCapNhat } from "@/lib/phimapi";
import { Explore } from "@/components/movie/explore";

export default async function TrendingPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page } = await searchParams;
  const pageNum = Number(page) || 1;

  const result = await getPhimMoiCapNhat(pageNum);

  return (
    <Explore
      title="Phim mới cập nhật"
      items={result.items}
      pagination={result.pagination}
      baseHref="/trending"
    />
  );
}
