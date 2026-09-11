import { Media, MovieServer, ServerEpisode } from "@/types/movie";
import { allMedia, movies, shows } from "@/lib/mock-data";

const BASE_URL = "https://phimapi.com";
const DEFAULT_CDN = "https://phimimg.com";

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  totalItemsPerPage: number;
}

export interface PhimListResult {
  items: Media[];
  pagination: PaginationInfo;
}

function resolveImageUrl(path?: string, cdn = DEFAULT_CDN): string {
  if (!path) return "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=85";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const clean = path.startsWith("/") ? path.slice(1) : path;
  return `${cdn}/${clean}`;
}

function stripHtml(html?: string): string {
  if (!html) return "";
  return html.replace(/<[^>]*>?/gm, "").trim();
}

// Bản đồ ảnh nền độ phân giải cao 1080p/4K (TMDB Original) thay thế cho ảnh thumb mờ 780px của bên thứ ba
export const HIGH_RES_BACKDROPS: Record<string, string> = {
  "mui-pho": "https://image.tmdb.org/t/p/original/5Khb0mc2PEQTY5o2JbAORXmQ0Y7.jpg",
  "hen-em-ngay-nhat-thuc": "https://image.tmdb.org/t/p/original/favJdkLy5La3d0Lk7H3ILPLPOHM.jpg",
  "hanh-trinh-cua-moana": "https://image.tmdb.org/t/p/original/qLVNZFHYUR6Li64He67SWl6BHQe.jpg",
  "doraemon-nobita-va-lau-dai-duoi-day-bien-phien-ban-moi": "https://image.tmdb.org/t/p/original/pxd9rc03EMMln3tVFdfd427Fpsi.jpg",
  "con-ke-ba-nghe": "https://image.tmdb.org/t/p/original/ueLfdnuWxiWQX2rN1cYAEBdtdKt.jpg",
  "nguoi-nhen-khoi-dau-moi": "https://image.tmdb.org/t/p/original/qeQJx07rK2xm8SD2sJxFKhE7gs0.jpg",
  "tam-biet-gohan": "https://image.tmdb.org/t/p/original/gkb6yj4lRIkOQcLuni8V59YvKex.jpg",
  "anh-hung-2026": "https://image.tmdb.org/t/p/original/lRneBPpPRPzg2kHIY4yNZzLq3z8.jpg",
  "tau-buon-nguoi": "https://image.tmdb.org/t/p/original/e2QAGrEmbpmZpMymDRkDisJkvg9.jpg",
  "quy-nhap-trang-2": "https://image.tmdb.org/t/p/original/tsTxd867zVQym58yeQ8DWZ5ev7.jpg",
  "cau-chuyen-do-choi-5": "https://image.tmdb.org/t/p/original/qjTqY5coNiz6sVtPng40IzltsoN.jpg",
  "cuoc-chien-sinh-tu-ii": "https://image.tmdb.org/t/p/original/4EAAwpylq313qrDqpCxulUrXBNF.jpg",
  "ma-cay-lua-dia-nguc": "https://image.tmdb.org/t/p/original/o0jkkpcN81QqSl8DMLScBCXyUH9.jpg",
  "con-thinh-no": "https://image.tmdb.org/t/p/original/i0eR9O1FnCgBm1cH8WwqxGbAXMS.jpg",
  "bay-xac-song": "https://image.tmdb.org/t/p/original/hpBGCnzOvdtQoMyE48gvwp2y5yx.jpg",
};

function normalizePhimItem(item: any, cdn = DEFAULT_CDN): Media {
  const isSeries = item.type === "series" || item.type === "tvshows" || (item.episode_total && item.episode_total !== "1");
  const posterPath = resolveImageUrl(item.poster_url || item.thumb_url, cdn);
  
  // Ưu tiên ảnh nền 1080p/4K từ TMDB để hiển thị sắc nét tuyệt đối trên Hero và trang Chi tiết
  const highResBackdrop = item.slug ? HIGH_RES_BACKDROPS[item.slug] : undefined;
  const backdropPath = highResBackdrop || resolveImageUrl(item.thumb_url || item.poster_url, cdn);
  
  const categoryNames = Array.isArray(item.category) 
    ? item.category.map((c: any) => c.name).filter(Boolean)
    : [];

  const countryNames = Array.isArray(item.country)
    ? item.country.map((c: any) => c.name).filter(Boolean)
    : [];
  const countrySlugs = Array.isArray(item.country)
    ? item.country.map((c: any) => c.slug).filter(Boolean)
    : [];
  const itemYear = item.year ? Number(item.year) : (item.releaseDate ? new Date(item.releaseDate).getFullYear() : undefined);

  return {
    id: item.slug || item._id || String(Math.random()),
    slug: item.slug,
    title: item.name || item.origin_name || "Chưa có tiêu đề",
    originalTitle: item.origin_name,
    overview: stripHtml(item.content || item.description || `Phim ${item.name} (${item.year || ""}) phát hành với chất lượng ${item.quality || "HD"} ${item.lang || ""}`),
    posterPath,
    backdropPath,
    releaseDate: item.year ? `${item.year}-01-01` : "2024-01-01",
    year: itemYear,
    country: countryNames[0] || undefined,
    countrySlug: countrySlugs[0] || undefined,
    voteAverage: Number(item.tmdb?.vote_average || item.imdb?.vote_average || 8.0),
    genreIds: [18],
    genres: categoryNames.length > 0 ? categoryNames : ["Phim"],
    mediaType: isSeries ? "tv" : "movie",
    quality: item.quality || "FHD",
    lang: item.lang || "Vietsub",
    episodeCurrent: item.episode_current || item.time || (isSeries ? "Đang cập nhật" : "Full"),
  };
}

const defaultPagination = (count: number): PaginationInfo => ({
  currentPage: 1,
  totalPages: 1,
  totalItems: count,
  totalItemsPerPage: count,
});

/**
 * Lấy danh sách phim mới cập nhật (kèm phân trang)
 */
export async function getPhimMoiCapNhat(page = 1): Promise<PhimListResult> {
  try {
    const res = await fetch(`${BASE_URL}/danh-sach/phim-moi-cap-nhat?page=${page}`, {
      next: { revalidate: 900 },
    });
    if (!res.ok) return { items: allMedia, pagination: defaultPagination(allMedia.length) };
    const data = await res.json();
    if (!data.status || !Array.isArray(data.items)) return { items: allMedia, pagination: defaultPagination(allMedia.length) };
    
    const items = data.items.map((item: any) => normalizePhimItem(item, DEFAULT_CDN));
    const pag = data.pagination || {};
    return {
      items,
      pagination: {
        currentPage: Number(pag.currentPage || page),
        totalPages: Number(pag.totalPages || 100),
        totalItems: Number(pag.totalItems || items.length),
        totalItemsPerPage: Number(pag.totalItemsPerPage || items.length),
      },
    };
  } catch (error) {
    console.error("Lỗi khi tải phim mới cập nhật:", error);
    return { items: allMedia, pagination: defaultPagination(allMedia.length) };
  }
}

/**
 * Lấy danh sách phim lẻ (kèm phân trang)
 */
/**
 * Lấy danh sách phim lẻ (kèm phân trang)
 */
export async function getPhimLe(page = 1, limit = 24, year?: number): Promise<PhimListResult> {
  try {
    const url = year 
      ? `${BASE_URL}/v1/api/danh-sach/phim-le?page=${page}&limit=${limit}&year=${year}`
      : `${BASE_URL}/v1/api/danh-sach/phim-le?page=${page}&limit=${limit}`;
    const res = await fetch(url, {
      next: { revalidate: 1800 },
    });
    if (!res.ok) return { items: movies, pagination: defaultPagination(movies.length) };
    const data = await res.json();
    const cdn = data.data?.APP_DOMAIN_CDN_IMAGE || DEFAULT_CDN;
    const rawItems = data.data?.items || [];
    const items = rawItems.map((item: any) => normalizePhimItem(item, cdn));
    const pag = data.data?.params?.pagination || {};

    return {
      items,
      pagination: {
        currentPage: Number(pag.currentPage || page),
        totalPages: Number(pag.totalPages || 1),
        totalItems: Number(pag.totalItems || items.length),
        totalItemsPerPage: Number(pag.totalItemsPerPage || limit),
      },
    };
  } catch (error) {
    console.error("Lỗi khi tải phim lẻ:", error);
    return { items: movies, pagination: defaultPagination(movies.length) };
  }
}

/**
 * Lấy danh sách phim chiếu rạp mới nhất (có hỗ trợ lọc theo năm phát hành)
 */
export async function getPhimChieuRap(page = 1, limit = 24, year?: number): Promise<PhimListResult> {
  try {
    const url = year 
      ? `${BASE_URL}/v1/api/danh-sach/phim-chieu-rap?page=${page}&limit=${limit}&year=${year}`
      : `${BASE_URL}/v1/api/danh-sach/phim-chieu-rap?page=${page}&limit=${limit}`;
    const res = await fetch(url, {
      next: { revalidate: 1800 },
    });
    if (!res.ok) return { items: movies, pagination: defaultPagination(movies.length) };
    const data = await res.json();
    const cdn = data.data?.APP_DOMAIN_CDN_IMAGE || DEFAULT_CDN;
    const rawItems = data.data?.items || [];
    const items = rawItems.map((item: any) => normalizePhimItem(item, cdn));
    const pag = data.data?.params?.pagination || {};

    return {
      items,
      pagination: {
        currentPage: Number(pag.currentPage || page),
        totalPages: Number(pag.totalPages || 1),
        totalItems: Number(pag.totalItems || items.length),
        totalItemsPerPage: Number(pag.totalItemsPerPage || limit),
      },
    };
  } catch (error) {
    console.error("Lỗi khi tải phim chiếu rạp:", error);
    return { items: movies, pagination: defaultPagination(movies.length) };
  }
}

/**
 * Lấy danh sách phim bộ (kèm phân trang)
 */
export async function getPhimBo(page = 1, limit = 24, year?: number): Promise<PhimListResult> {
  try {
    const url = year 
      ? `${BASE_URL}/v1/api/danh-sach/phim-bo?page=${page}&limit=${limit}&year=${year}`
      : `${BASE_URL}/v1/api/danh-sach/phim-bo?page=${page}&limit=${limit}`;
    const res = await fetch(url, {
      next: { revalidate: 1800 },
    });
    if (!res.ok) return { items: shows, pagination: defaultPagination(shows.length) };
    const data = await res.json();
    const cdn = data.data?.APP_DOMAIN_CDN_IMAGE || DEFAULT_CDN;
    const rawItems = data.data?.items || [];
    const items = rawItems.map((item: any) => normalizePhimItem(item, cdn));
    const pag = data.data?.params?.pagination || {};

    return {
      items,
      pagination: {
        currentPage: Number(pag.currentPage || page),
        totalPages: Number(pag.totalPages || 1),
        totalItems: Number(pag.totalItems || items.length),
        totalItemsPerPage: Number(pag.totalItemsPerPage || limit),
      },
    };
  } catch (error) {
    console.error("Lỗi khi tải phim bộ:", error);
    return { items: shows, pagination: defaultPagination(shows.length) };
  }
}

/**
 * Lấy danh sách hoạt hình / anime
 */
export async function getHoatHinh(page = 1, limit = 24, year?: number): Promise<PhimListResult> {
  try {
    const url = year 
      ? `${BASE_URL}/v1/api/danh-sach/hoat-hinh?page=${page}&limit=${limit}&year=${year}`
      : `${BASE_URL}/v1/api/danh-sach/hoat-hinh?page=${page}&limit=${limit}`;
    const res = await fetch(url, {
      next: { revalidate: 1800 },
    });
    if (!res.ok) return { items: [], pagination: defaultPagination(0) };
    const data = await res.json();
    const cdn = data.data?.APP_DOMAIN_CDN_IMAGE || DEFAULT_CDN;
    const rawItems = data.data?.items || [];
    const items = rawItems.map((item: any) => normalizePhimItem(item, cdn));
    const pag = data.data?.params?.pagination || {};

    return {
      items,
      pagination: {
        currentPage: Number(pag.currentPage || page),
        totalPages: Number(pag.totalPages || 1),
        totalItems: Number(pag.totalItems || items.length),
        totalItemsPerPage: Number(pag.totalItemsPerPage || limit),
      },
    };
  } catch (error) {
    console.error("Lỗi khi tải hoạt hình:", error);
    return { items: [], pagination: defaultPagination(0) };
  }
}

/**
 * Lấy danh sách TV shows
 */
export async function getTVShows(page = 1, limit = 24, year?: number): Promise<PhimListResult> {
  try {
    const url = year 
      ? `${BASE_URL}/v1/api/danh-sach/tv-shows?page=${page}&limit=${limit}&year=${year}`
      : `${BASE_URL}/v1/api/danh-sach/tv-shows?page=${page}&limit=${limit}`;
    const res = await fetch(url, {
      next: { revalidate: 1800 },
    });
    if (!res.ok) return { items: [], pagination: defaultPagination(0) };
    const data = await res.json();
    const cdn = data.data?.APP_DOMAIN_CDN_IMAGE || DEFAULT_CDN;
    const rawItems = data.data?.items || [];
    const items = rawItems.map((item: any) => normalizePhimItem(item, cdn));
    const pag = data.data?.params?.pagination || {};

    return {
      items,
      pagination: {
        currentPage: Number(pag.currentPage || page),
        totalPages: Number(pag.totalPages || 1),
        totalItems: Number(pag.totalItems || items.length),
        totalItemsPerPage: Number(pag.totalItemsPerPage || limit),
      },
    };
  } catch (error) {
    console.error("Lỗi khi tải TV shows:", error);
    return { items: [], pagination: defaultPagination(0) };
  }
}

/**
 * Lấy phim theo Thể loại (Ví dụ: hanh-dong, co-trang, tinh-cam, vien-tuong, kinh-di...)
 */
export async function getPhimByTheLoai(slug: string, page = 1, limit = 24, year?: number): Promise<PhimListResult> {
  try {
    const url = year
      ? `${BASE_URL}/v1/api/the-loai/${slug}?page=${page}&limit=${limit}&year=${year}`
      : `${BASE_URL}/v1/api/the-loai/${slug}?page=${page}&limit=${limit}`;
    const res = await fetch(url, {
      next: { revalidate: 1800 },
    });
    if (!res.ok) return { items: [], pagination: defaultPagination(0) };
    const data = await res.json();
    const cdn = data.data?.APP_DOMAIN_CDN_IMAGE || DEFAULT_CDN;
    const rawItems = data.data?.items || [];
    const items = rawItems.map((item: any) => normalizePhimItem(item, cdn));
    const pag = data.data?.params?.pagination || {};

    return {
      items,
      pagination: {
        currentPage: Number(pag.currentPage || page),
        totalPages: Number(pag.totalPages || 1),
        totalItems: Number(pag.totalItems || items.length),
        totalItemsPerPage: Number(pag.totalItemsPerPage || limit),
      },
    };
  } catch (error) {
    console.error("Lỗi khi tải phim theo thể loại:", slug, error);
    return { items: [], pagination: defaultPagination(0) };
  }
}

/**
 * Lấy phim theo Quốc gia (Ví dụ: han-quoc, trung-quoc, au-my, nhat-ban...)
 */
export async function getPhimByQuocGia(slug: string, page = 1, limit = 24, year?: number): Promise<PhimListResult> {
  try {
    const url = year
      ? `${BASE_URL}/v1/api/quoc-gia/${slug}?page=${page}&limit=${limit}&year=${year}`
      : `${BASE_URL}/v1/api/quoc-gia/${slug}?page=${page}&limit=${limit}`;
    const res = await fetch(url, {
      next: { revalidate: 1800 },
    });
    if (!res.ok) return { items: [], pagination: defaultPagination(0) };
    const data = await res.json();
    const cdn = data.data?.APP_DOMAIN_CDN_IMAGE || DEFAULT_CDN;
    const rawItems = data.data?.items || [];
    const items = rawItems.map((item: any) => normalizePhimItem(item, cdn));
    const pag = data.data?.params?.pagination || {};

    return {
      items,
      pagination: {
        currentPage: Number(pag.currentPage || page),
        totalPages: Number(pag.totalPages || 1),
        totalItems: Number(pag.totalItems || items.length),
        totalItemsPerPage: Number(pag.totalItemsPerPage || limit),
      },
    };
  } catch (error) {
    console.error("Lỗi khi tải phim theo quốc gia:", slug, error);
    return { items: [], pagination: defaultPagination(0) };
  }
}

export interface PhimDetailResult {
  media: Media;
  servers: MovieServer[];
  rawMovie: any;
}

/**
 * Lấy chi tiết phim và danh sách tập / server
 */
export async function getPhimDetail(slug: string): Promise<PhimDetailResult | null> {
  try {
    const res = await fetch(`${BASE_URL}/phim/${slug}`, {
      next: { revalidate: 600 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.status || !data.movie) return null;

    const movie = data.movie;
    const media = normalizePhimItem(movie, DEFAULT_CDN);

    const servers: MovieServer[] = (data.episodes || []).map((srv: any) => ({
      serverName: srv.server_name || "Mặc định",
      episodes: (srv.server_data || []).map((ep: any): ServerEpisode => ({
        name: ep.name,
        slug: ep.slug,
        filename: ep.filename,
        linkEmbed: ep.link_embed,
        linkM3u8: ep.link_m3u8,
      })),
    }));

    return {
      media,
      servers,
      rawMovie: movie,
    };
  } catch (error) {
    console.error("Lỗi khi tải chi tiết phim:", slug, error);
    return null;
  }
}

/**
 * Tìm kiếm phim theo từ khóa, có thể kết hợp lọc theo năm và quốc gia
 */
export async function searchPhim(
  keyword: string, 
  limit = 30,
  year?: number,
  country?: string
): Promise<Media[]> {
  if (!keyword || !keyword.trim()) return [];
  try {
    let url = `${BASE_URL}/v1/api/tim-kiem?keyword=${encodeURIComponent(keyword.trim())}&limit=${limit}`;
    if (year) url += `&year=${year}`;
    if (country) url += `&country=${encodeURIComponent(country)}`;

    const res = await fetch(url, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    const cdn = data.data?.APP_DOMAIN_CDN_IMAGE || DEFAULT_CDN;
    const items = data.data?.items || [];
    let normalized = items.map((item: any) => normalizePhimItem(item, cdn));

    if (country) {
      normalized = normalized.filter((m: Media) => !m.countrySlug || m.countrySlug === country);
    }
    if (year) {
      normalized = normalized.filter((m: Media) => {
        if (m.year) return m.year === year;
        if (m.releaseDate) return new Date(m.releaseDate).getFullYear() === year;
        return true;
      });
    }

    return normalized;
  } catch (error) {
    console.error("Lỗi khi tìm kiếm phim:", keyword, error);
    return [];
  }
}
