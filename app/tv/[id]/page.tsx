import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Play } from "lucide-react";
import { DetailHero } from "@/components/movie/details";
import { episodes, findMedia, shows } from "@/lib/mock-data";
import { MovieRail } from "@/components/movie/movie-rail";
import { getPhimBo, getPhimDetail } from "@/lib/phimapi";

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

export default async function TVDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getPhimDetail(id);
  const media = detail?.media ?? findMedia(id);

  if (!media) notFound();

  const moreShowsRes = await getPhimBo(1);
  const filteredShows = moreShowsRes.items.filter((s) => String(s.id) !== String(media.id) && s.slug !== media.slug);

  // Danh sách tập từ server đầu tiên nếu có
  const primaryServer = detail?.servers[0];
  const episodeList = primaryServer?.episodes || [];

  return (
    <main>
      <DetailHero media={media} />
      <section className="details-lower">
        <div className="episode-section">
          <div className="episode-heading">
            <h2>Danh sách tập {primaryServer ? `(${primaryServer.serverName})` : ""}</h2>
            {detail?.servers && detail.servers.length > 1 && (
              <span style={{ fontSize: 12, color: "var(--muted)" }}>
                {detail.servers.length} máy chủ phát
              </span>
            )}
          </div>

          <div className="episode-list">
            {episodeList.length > 0 ? (
              episodeList.map((ep, idx) => (
                <Link
                  key={ep.slug}
                  href={`/watch/tv/${media.slug || media.id}/1/${idx + 1}`}
                  className="episode"
                >
                  <div style={{
                    height: 100,
                    width: 180,
                    borderRadius: 7,
                    background: "var(--surface-2)",
                    display: "grid",
                    placeItems: "center",
                    position: "relative",
                    overflow: "hidden"
                  }}>
                    <img
                      src={media.backdropPath}
                      alt={ep.name}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                    <div style={{
                      position: "absolute",
                      inset: 0,
                      background: "rgba(0,0,0,0.35)",
                      display: "grid",
                      placeItems: "center"
                    }}>
                      <Play size={24} fill="#fff" color="#fff" />
                    </div>
                  </div>
                  <div>
                    <span>{ep.name}</span>
                    <h3>{ep.filename || `${media.title} - ${ep.name}`}</h3>
                    <p>{media.overview.slice(0, 140)}...</p>
                  </div>
                  <time>M3U8 / FHD</time>
                  <Play size={18} />
                </Link>
              ))
            ) : (
              episodes.map((episode) => (
                <Link
                  key={episode.id}
                  href={`/watch/tv/${media.id}/1/${episode.episode}`}
                  className="episode"
                >
                  <img src={episode.image} alt="" />
                  <div>
                    <span>Tập {episode.episode}</span>
                    <h3>{episode.title}</h3>
                    <p>{episode.overview}</p>
                  </div>
                  <time>{episode.runtime}m</time>
                  <Play size={18} />
                </Link>
              ))
            )}
          </div>
        </div>

        <MovieRail
          title="Phim bộ đề xuất khác"
          items={filteredShows.length > 0 ? filteredShows : shows}
          href="/tv"
        />
      </section>
    </main>
  );
}
