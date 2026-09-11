import { Metadata } from "next";
import { notFound } from "next/navigation";
import { cast, findMedia, movies } from "@/lib/mock-data";
import { DetailHero } from "@/components/movie/details";
import { MovieRail } from "@/components/movie/movie-rail";
import { getPhimDetail, getPhimMoiCapNhat } from "@/lib/phimapi";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const detail = await getPhimDetail(id);
  const media = detail?.media ?? findMedia(id);
  return {
    title: `${media.title} - QMovies`,
    description: media.overview,
    openGraph: { images: [media.backdropPath] },
  };
}

export default async function MovieDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  // Thử lấy thông tin thực tế từ PhimAPI
  const detail = await getPhimDetail(id);
  const media = detail?.media ?? findMedia(id);

  if (!media) notFound();

  const relatedRes = await getPhimMoiCapNhat(1);
  const filteredRelated = relatedRes.items.filter((m) => String(m.id) !== String(media.id) && m.slug !== media.slug);

  return (
    <main>
      <DetailHero media={media} />
      <section className="details-lower">
        {detail?.rawMovie?.actor && detail.rawMovie.actor.length > 0 && (
          <div className="credit-block">
            <h2>Diễn viên</h2>
            <div className="cast-list">
              {detail.rawMovie.actor.map((actorName: string, idx: number) => (
                <div className="cast" key={`${actorName}-${idx}`}>
                  <div style={{
                    width: 39,
                    height: 39,
                    borderRadius: "50%",
                    background: "var(--surface-2)",
                    display: "grid",
                    placeItems: "center",
                    fontWeight: 600,
                    fontSize: 14
                  }}>
                    {actorName.charAt(0)}
                  </div>
                  <div>
                    <strong>{actorName}</strong>
                    <span>Diễn viên</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        <MovieRail
          title="Có thể bạn quan tâm"
          items={filteredRelated.length > 0 ? filteredRelated : movies}
        />
      </section>
    </main>
  );
}
