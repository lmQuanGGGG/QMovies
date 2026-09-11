import { Episode, Media, Person } from "@/types/movie";

const image = (id: string, width = 600) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=85`;

export const movies: Media[] = [
  { id: 1, title: "Dune: Part Two", originalTitle: "Dune: Part Two", overview: "Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.", posterPath: image("photo-1534447677768-be436bb09401"), backdropPath: image("photo-1500534623283-312aade485b7", 1800), releaseDate: "2024-03-01", voteAverage: 8.4, genreIds: [878, 12], mediaType: "movie", runtime: 166 },
  { id: 2, title: "Past Lives", overview: "Two childhood friends are reunited in New York for one fateful week as they confront destiny, love, and the choices that make a life.", posterPath: image("photo-1483985988355-763728e1935b"), backdropPath: image("photo-1492684223066-81342ee5ff30", 1800), releaseDate: "2023-06-02", voteAverage: 7.8, genreIds: [18, 10749], mediaType: "movie", runtime: 106 },
  { id: 3, title: "The Holdovers", overview: "A curmudgeonly instructor at a New England prep school forms an unlikely bond with a troubled student.", posterPath: image("photo-1481627834876-b7833e8f5570"), backdropPath: image("photo-1516939884455-1445c8652f83", 1800), releaseDate: "2023-10-27", voteAverage: 7.7, genreIds: [35, 18], mediaType: "movie", runtime: 133 },
  { id: 4, title: "Oppenheimer", overview: "The story of J. Robert Oppenheimer and his role in the development of the atomic bomb.", posterPath: image("photo-1500530855697-b586d89ba3ee"), backdropPath: image("photo-1500534314209-a25ddb2bd429", 1800), releaseDate: "2023-07-21", voteAverage: 8.1, genreIds: [18, 36], mediaType: "movie", runtime: 180 },
  { id: 5, title: "The Creator", overview: "Amid a future war between the human race and the forces of artificial intelligence, a hardened ex-special forces agent is recruited.", posterPath: image("photo-1531058020387-3be344556be6"), backdropPath: image("photo-1446776811953-b23d57bd21aa", 1800), releaseDate: "2023-09-29", voteAverage: 7.1, genreIds: [878, 28], mediaType: "movie", runtime: 134 },
  { id: 6, title: "Anatomy of a Fall", overview: "A woman is suspected of murder after her husband's death, and their half-blind son faces a moral dilemma.", posterPath: image("photo-1497366754035-f200968a6e72"), backdropPath: image("photo-1497366811353-6870744d04b2", 1800), releaseDate: "2023-08-23", voteAverage: 7.7, genreIds: [18, 9648], mediaType: "movie", runtime: 151 },
  { id: 7, title: "Poor Things", overview: "Brought back to life by an unorthodox scientist, a young woman runs off with a debauched lawyer on a whirlwind adventure.", posterPath: image("photo-1499443015577-475c9deb6a0d"), backdropPath: image("photo-1483985988355-763728e1935b", 1800), releaseDate: "2023-12-08", voteAverage: 7.9, genreIds: [18, 878], mediaType: "movie", runtime: 141 },
  { id: 8, title: "Society of the Snow", overview: "The true story of a rugby team trapped in one of the most hostile environments on Earth.", posterPath: image("photo-1464822759023-fed622ff2c3b"), backdropPath: image("photo-1464822759844-d150baec0494", 1800), releaseDate: "2023-12-15", voteAverage: 8.0, genreIds: [18, 12], mediaType: "movie", runtime: 144 },
];

export const shows: Media[] = [
  { id: 101, title: "Severance", overview: "Mark leads a team of office workers whose memories have been surgically divided between their work and personal lives.", posterPath: image("photo-1497215728101-856f4ea42174"), backdropPath: image("photo-1497366412874-3415097a27e7", 1800), releaseDate: "2022-02-18", voteAverage: 8.6, genreIds: [18, 878, 9648], mediaType: "tv", runtime: 50, progress: 52 },
  { id: 102, title: "Shōgun", overview: "When a mysterious European ship is found marooned in a nearby fishing village, its English pilot comes bearing secrets.", posterPath: image("photo-1492571350019-22de08371fd3"), backdropPath: image("photo-1537996194471-e657df975ab4", 1800), releaseDate: "2024-02-27", voteAverage: 8.7, genreIds: [18, 28], mediaType: "tv", runtime: 56 },
  { id: 103, title: "The Bear", overview: "A young chef from the world of fine dining comes home to Chicago to run his family's sandwich shop.", posterPath: image("photo-1556910103-1c02745aae4d"), backdropPath: image("photo-1556911220-e15b29be8c8f", 1800), releaseDate: "2022-06-23", voteAverage: 8.3, genreIds: [18, 35], mediaType: "tv", runtime: 31 },
  { id: 104, title: "Blue Eye Samurai", overview: "A mixed-race master of the sword lives a life in disguise while seeking revenge in Edo-period Japan.", posterPath: image("photo-1534528741775-53994a69daeb"), backdropPath: image("photo-1528360983277-13d401cdc186", 1800), releaseDate: "2023-11-03", voteAverage: 8.5, genreIds: [16, 18, 28], mediaType: "tv", runtime: 45 },
];

export const cast: Person[] = [
  { id: 1, name: "Timothée Chalamet", character: "Paul Atreides", image: image("photo-1500648767791-00dcc994a43e", 200) },
  { id: 2, name: "Zendaya", character: "Chani", image: image("photo-1534528741775-53994a69daeb", 200) },
  { id: 3, name: "Rebecca Ferguson", character: "Lady Jessica", image: image("photo-1531123897727-8f129e1688ce", 200) },
  { id: 4, name: "Javier Bardem", character: "Stilgar", image: image("photo-1507003211169-0a1dd7228f2d", 200) },
];

export const episodes: Episode[] = [1, 2, 3, 4, 5, 6].map((episode) => ({ id: episode, episode, title: ["Good News About Hell", "Half Loop", "In Perpetuity", "The You You Are", "The Grim Barbarity of Optics and Design", "The After Hours"][episode - 1], overview: "A new discovery brings the divided worlds a little closer together, with consequences for everyone involved.", runtime: 47 + episode, image: image(["photo-1497366811353-6870744d04b2", "photo-1497366412874-3415097a27e7", "photo-1497215728101-856f4ea42174"][episode % 3], 800), progress: episode === 2 ? 62 : undefined }));

export const allMedia = [...movies, ...shows];
export const findMedia = (id: number | string) => allMedia.find((item) => String(item.id) === String(id) || item.slug === String(id)) ?? movies[0];
