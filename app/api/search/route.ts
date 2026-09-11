import { NextResponse } from "next/server";
import { searchPhim, getPhimByQuocGia, getPhimLe } from "@/lib/phimapi";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") || "";
  const country = searchParams.get("country") || "";
  const yearParam = searchParams.get("year");
  const year = yearParam ? Number(yearParam) : undefined;
  
  if (query.trim()) {
    const results = await searchPhim(query.trim(), 40, year, country);
    return NextResponse.json(results);
  }

  // Khi chưa nhập từ khóa nhưng có chọn Quốc gia hoặc Năm
  if (country) {
    const res = await getPhimByQuocGia(country, 1, 30, year);
    return NextResponse.json(res.items);
  }

  if (year) {
    const res = await getPhimLe(1, 30, year);
    return NextResponse.json(res.items);
  }

  return NextResponse.json([]);
}
