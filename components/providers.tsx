"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { Media } from "@/types/movie";
import { WatchHistoryItem, WatchHistoryInput } from "@/types/history";

type AppState = {
  theme: "light" | "dark";
  toggleTheme: () => void;
  watchlist: Media[];
  toggleWatchlist: (media: Media) => void;
  isSaved: (id: number | string) => boolean;
  history: WatchHistoryItem[];
  saveHistory: (input: WatchHistoryInput) => void;
  getHistory: (mediaId: string | number) => WatchHistoryItem | undefined;
  removeFromHistory: (mediaId: string | number) => void;
  clearHistory: () => void;
};

const AppContext = createContext<AppState | null>(null);

export function Providers({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [watchlist, setWatchlist] = useState<Media[]>([]);
  const [history, setHistory] = useState<WatchHistoryItem[]>([]);

  useEffect(() => {
    const storedTheme = localStorage.getItem("qmovies-theme") as "light" | "dark" | null;
    const actualTheme = storedTheme ?? (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    setTheme(actualTheme);
    document.documentElement.dataset.theme = actualTheme;

    try {
      setWatchlist(JSON.parse(localStorage.getItem("qmovies-watchlist") ?? "[]"));
    } catch {
      /* ignore invalid storage */
    }

    try {
      setHistory(JSON.parse(localStorage.getItem("qmovies-watch-history") ?? "[]"));
    } catch {
      /* ignore invalid storage */
    }
  }, []);

  const toggleTheme = () =>
    setTheme((current) => {
      const next = current === "dark" ? "light" : "dark";
      document.documentElement.dataset.theme = next;
      localStorage.setItem("qmovies-theme", next);
      return next;
    });

  const toggleWatchlist = (media: Media) =>
    setWatchlist((current) => {
      const exists = current.some((item) => String(item.id) === String(media.id) || (media.slug && item.slug === media.slug));
      const next = exists
        ? current.filter((item) => String(item.id) !== String(media.id) && (!media.slug || item.slug !== media.slug))
        : [media, ...current];
      localStorage.setItem("qmovies-watchlist", JSON.stringify(next));
      return next;
    });

  const saveHistory = useCallback((input: WatchHistoryInput) => {
    // Tránh lưu nếu thời lượng không hợp lệ hoặc mới chỉ chạy dưới 2 giây
    if (!input.media || input.currentTime < 2) return;

    const percentage = input.duration > 0
      ? Math.min(100, Math.round((input.currentTime / input.duration) * 100))
      : 0;

    const newItem: WatchHistoryItem = {
      id: input.media.id,
      slug: input.media.slug,
      title: input.media.title,
      posterPath: input.media.posterPath,
      backdropPath: input.media.backdropPath,
      mediaType: input.media.mediaType,
      serverIdx: input.serverIdx,
      serverName: input.serverName,
      episodeIdx: input.episodeIdx,
      episodeName: input.episodeName,
      currentTime: Math.floor(input.currentTime),
      duration: Math.floor(input.duration),
      percentage,
      updatedAt: Date.now(),
    };

    setHistory((prev) => {
      const filtered = prev.filter(
        (item) =>
          String(item.id) !== String(input.media.id) &&
          (!input.media.slug || item.slug !== input.media.slug)
      );
      // Giới hạn tối đa 60 phim trong lịch sử xem
      const updated = [newItem, ...filtered].slice(0, 60);
      try {
        localStorage.setItem("qmovies-watch-history", JSON.stringify(updated));
      } catch (err) {
        console.warn("Could not save watch history:", err);
      }
      return updated;
    });
  }, []);

  const getHistory = useCallback(
    (mediaId: string | number) => {
      const idStr = String(mediaId);
      return history.find(
        (item) => String(item.id) === idStr || (item.slug && item.slug === idStr)
      );
    },
    [history]
  );

  const removeFromHistory = useCallback((mediaId: string | number) => {
    const idStr = String(mediaId);
    setHistory((prev) => {
      const next = prev.filter(
        (item) => String(item.id) !== idStr && (!item.slug || item.slug !== idStr)
      );
      localStorage.setItem("qmovies-watch-history", JSON.stringify(next));
      return next;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    localStorage.removeItem("qmovies-watch-history");
  }, []);

  return (
    <AppContext.Provider
      value={{
        theme,
        toggleTheme,
        watchlist,
        toggleWatchlist,
        isSaved: (id) => watchlist.some((item) => String(item.id) === String(id)),
        history,
        saveHistory,
        getHistory,
        removeFromHistory,
        clearHistory,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => {
  const state = useContext(AppContext);
  if (!state) throw new Error("useApp must be used inside Providers");
  return state;
};
