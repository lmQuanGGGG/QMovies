"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { 
  AlertCircle, 
  Check,
  ChevronLeft,
  ChevronRight,
  Expand, 
  Film, 
  Minimize,
  MonitorPlay, 
  Pause, 
  Play, 
  RefreshCw, 
  RotateCcw, 
  RotateCw,
  Scaling,
  Server, 
  Settings,
  SkipForward,
  Sliders,
  Volume2, 
  VolumeX 
} from "lucide-react";
import { VideoSource } from "@/lib/video/sources";
import { Media, MovieServer } from "@/types/movie";
import { useApp } from "@/components/providers";

interface VideoPlayerProps {
  source: VideoSource;
  servers?: MovieServer[];
  media?: Media;
  onEpisodeChange?: (serverIdx: number, episodeIdx: number) => void;
}

interface QualityOption {
  label: string;
  levelIndex: number;
}

export function VideoPlayer({ source, servers: propServers, media, onEpisodeChange }: VideoPlayerProps) {
  const { saveHistory, getHistory } = useApp();
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const settingsRef = useRef<HTMLDivElement>(null);

  const availableServers = propServers || source.servers || [];
  const [selectedServerIdx, setSelectedServerIdx] = useState(source.currentServerIndex ?? 0);
  const [selectedEpisodeIdx, setSelectedEpisodeIdx] = useState(source.currentEpisodeIndex ?? 0);

  // Trạng thái toàn màn hình (Native & Web Fullscreen Edge-to-edge)
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isWebFullscreen, setIsWebFullscreen] = useState(false);

  // Chế độ tỷ lệ khung hình: "contain" (Vừa khung), "cover" (Tràn viền / Cắt viền đen), "fill" (Kéo giãn)
  const [videoFit, setVideoFit] = useState<"contain" | "cover" | "fill">("contain");

  // Trạng thái khôi phục đoạn xem (Resume Playback)
  const [resumeToast, setResumeToast] = useState<{ time: number; episodeName?: string } | null>(null);
  const [switchEpisodePrompt, setSwitchEpisodePrompt] = useState<{
    episodeIdx: number;
    episodeName: string;
    time: number;
    serverIdx: number;
  } | null>(null);
  const hasResumedRef = useRef(false);
  const lastSavedTimeRef = useRef(0);

  const [playerMode, setPlayerMode] = useState<"hls" | "embed">(() => {
    return source.url ? "hls" : "embed";
  });

  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [buffering, setBuffering] = useState(false);

  // Cài đặt chất lượng, tốc độ & tỷ lệ hiển thị
  const [qualityOptions, setQualityOptions] = useState<QualityOption[]>([
    { label: "Tự động (Auto)", levelIndex: -1 },
  ]);
  const [selectedQuality, setSelectedQuality] = useState<number>(-1);
  const [selectedSpeed, setSelectedSpeed] = useState<number>(1);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [settingsView, setSettingsView] = useState<"main" | "quality" | "speed" | "aspectRatio">("main");

  // Tooltip xem trước thời gian khi rê chuột trên thanh tua (Scrubber)
  const [scrubHoverTime, setScrubHoverTime] = useState<number | null>(null);
  const [scrubHoverPos, setScrubHoverPos] = useState<number>(0);

  // Trạng thái tự động ẩn thanh điều khiển khi không rê chuột (YouTube/Netflix style)
  const [controlsVisible, setControlsVisible] = useState(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleUserActivity = useCallback(() => {
    setControlsVisible(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    if (playing) {
      controlsTimeoutRef.current = setTimeout(() => {
        if (!showSettings) {
          setControlsVisible(false);
        }
      }, 2800);
    }
  }, [playing, showSettings]);

  useEffect(() => {
    if (!playing) {
      setControlsVisible(true);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    } else {
      handleUserActivity();
    }
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [playing, handleUserActivity]);

  // OSD Toast phản hồi khi bấm phím tắt
  const [toast, setToast] = useState<{ icon: React.ReactNode; text?: string } | null>(null);
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

  const triggerToast = useCallback((icon: React.ReactNode, text?: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ icon, text });
    toastTimerRef.current = setTimeout(() => {
      setToast(null);
    }, 700);
  }, []);

  // Lấy link hiện tại dựa theo server và tập đang chọn
  const currentServer = availableServers[selectedServerIdx];
  const currentEpisode = currentServer?.episodes[selectedEpisodeIdx];

  const currentM3u8Url = currentEpisode?.linkM3u8 || source.url;
  const currentEmbedUrl = currentEpisode?.linkEmbed || source.embedUrl;
  const currentEpisodeName = currentEpisode?.name || source.episodeName || "Phát video";

  // Xác định thông tin tập cho phim bộ
  const hasMultipleEpisodes = !!(currentServer && currentServer.episodes.length > 1);
  const hasNextEpisode = !!(currentServer && selectedEpisodeIdx < currentServer.episodes.length - 1);
  const nextEpisode = hasNextEpisode ? currentServer.episodes[selectedEpisodeIdx + 1] : null;
  const hasPrevEpisode = selectedEpisodeIdx > 0;
  const prevEpisode = hasPrevEpisode && currentServer ? currentServer.episodes[selectedEpisodeIdx - 1] : null;

  // Lấy lịch sử xem trước đó từ cache
  const savedItem = getHistory(media?.id || media?.slug || "");

  // Khôi phục playback vị trí đã xem hôm trước
  const checkAndResume = useCallback((vid: HTMLVideoElement, dur: number) => {
    if (hasResumedRef.current || !savedItem) return;
    hasResumedRef.current = true;

    // Nếu là phim bộ và hôm trước xem tập khác với tập hiện tại
    if (
      typeof savedItem.episodeIdx === "number" &&
      savedItem.episodeIdx !== selectedEpisodeIdx &&
      availableServers[savedItem.serverIdx ?? 0]?.episodes[savedItem.episodeIdx]
    ) {
      setSwitchEpisodePrompt({
        episodeIdx: savedItem.episodeIdx,
        episodeName: savedItem.episodeName || `Tập ${savedItem.episodeIdx + 1}`,
        time: savedItem.currentTime,
        serverIdx: savedItem.serverIdx ?? 0,
      });
      return;
    }

    const savedTime = savedItem.currentTime;
    // Kiểm tra nếu đã xem hơn 4 giây và chưa kết thúc (còn hơn 15s)
    if (savedTime > 4 && dur > 0 && savedTime < (dur - 15)) {
      try {
        vid.currentTime = savedTime;
        setCurrentTime(savedTime);
        setResumeToast({
          time: savedTime,
          episodeName: savedItem.episodeName,
        });
        setTimeout(() => {
          setResumeToast((prev) => (prev?.time === savedTime ? null : prev));
        }, 8000);
      } catch (e) {
        console.warn("Could not seek to resume position:", e);
      }
    }
  }, [savedItem, selectedEpisodeIdx, availableServers]);

  // Tự động lưu tiến trình xem vào cache
  const persistProgress = useCallback((time: number, dur: number) => {
    if (!media || time < 2 || dur <= 0) return;
    saveHistory({
      media,
      serverIdx: selectedServerIdx,
      serverName: currentServer?.serverName,
      episodeIdx: selectedEpisodeIdx,
      episodeName: currentEpisode?.name || source.episodeName || "Full",
      currentTime: time,
      duration: dur,
    });
  }, [media, selectedServerIdx, currentServer, selectedEpisodeIdx, currentEpisode, source.episodeName, saveHistory]);

  // Khởi tạo và cập nhật HLS player khi m3u8 url thay đổi
  useEffect(() => {
    if (playerMode !== "hls") {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      return;
    }

    const video = videoRef.current;
    if (!video || !currentM3u8Url) return;

    setError(null);
    setBuffering(true);

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90,
      });
      hlsRef.current = hls;

      hls.loadSource(currentM3u8Url);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (_event, data) => {
        setBuffering(false);

        // Lấy danh sách chất lượng có sẵn từ luồng HLS
        if (data.levels && data.levels.length > 0) {
          const levels: QualityOption[] = data.levels.map((lvl, idx) => ({
            label: lvl.height ? `${lvl.height}p` : `Chất lượng ${idx + 1}`,
            levelIndex: idx,
          }));
          levels.reverse(); // Đưa độ phân giải cao lên đầu
          setQualityOptions([
            { label: "Tự động (Auto)", levelIndex: -1 },
            ...levels,
          ]);
        } else {
          setQualityOptions([
            { label: "Tự động (Auto)", levelIndex: -1 },
            { label: "1080p (FHD)", levelIndex: 0 },
            { label: "720p (HD)", levelIndex: 1 },
          ]);
        }

        video.play().catch(() => {
          setPlaying(false);
        });
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          console.warn("HLS Fatal error:", data.type, data.details);
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              hls.destroy();
              setError("Luồng M3U8 gặp sự cố kết nối. Bạn có thể chuyển sang Trình phát Embed (Nhúng).");
              break;
          }
        }
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // Hỗ trợ Safari native HLS
      video.src = currentM3u8Url;
      video.addEventListener("loadedmetadata", () => {
        setBuffering(false);
        video.play().catch(() => setPlaying(false));
      });
    } else {
      setPlayerMode("embed");
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [currentM3u8Url, playerMode]);

  // Lắng nghe sự kiện của video element
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      if (Math.abs(video.currentTime - lastSavedTimeRef.current) >= 4) {
        lastSavedTimeRef.current = video.currentTime;
        persistProgress(video.currentTime, video.duration || duration);
      }
    };

    const onDurationChange = () => {
      const dur = video.duration || 0;
      setDuration(dur);
      if (dur > 0) {
        checkAndResume(video, dur);
      }
    };

    const onWaiting = () => setBuffering(true);
    const onPlaying = () => {
      setBuffering(false);
      setPlaying(true);
      if (video.duration) {
        checkAndResume(video, video.duration);
      }
    };

    const onPause = () => {
      setPlaying(false);
      persistProgress(video.currentTime, video.duration || duration);
    };

    const onEnded = () => {
      setPlaying(false);
      const dur = video.duration || duration;
      persistProgress(dur, dur);
      if (currentServer && selectedEpisodeIdx < currentServer.episodes.length - 1) {
        handleSelectEpisode(selectedServerIdx, selectedEpisodeIdx + 1);
      }
    };

    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("durationchange", onDurationChange);
    video.addEventListener("waiting", onWaiting);
    video.addEventListener("playing", onPlaying);
    video.addEventListener("pause", onPause);
    video.addEventListener("ended", onEnded);

    return () => {
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("durationchange", onDurationChange);
      video.removeEventListener("waiting", onWaiting);
      video.removeEventListener("playing", onPlaying);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("ended", onEnded);
    };
  }, [currentServer, selectedEpisodeIdx, selectedServerIdx, duration, checkAndResume, persistProgress]);

  // Tự động lưu khi tắt tab hoặc đổi tab
  useEffect(() => {
    const handleUnload = () => {
      if (videoRef.current) {
        persistProgress(videoRef.current.currentTime, videoRef.current.duration || duration);
      }
    };
    window.addEventListener("beforeunload", handleUnload);
    const handleVisibility = () => {
      if (document.visibilityState === "hidden" && videoRef.current) {
        persistProgress(videoRef.current.currentTime, videoRef.current.duration || duration);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.removeEventListener("beforeunload", handleUnload);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [persistProgress, duration]);

  // Đóng popup cài đặt khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setShowSettings(false);
        setSettingsView("main");
      }
    };
    if (showSettings) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showSettings]);

  const togglePlay = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      if (video.paused) {
        await video.play();
        setPlaying(true);
        triggerToast(<Play size={32} fill="currentColor" />);
      } else {
        video.pause();
        setPlaying(false);
        triggerToast(<Pause size={32} fill="currentColor" />);
      }
    } catch {
      setError("Không thể phát video.");
    }
  }, [triggerToast]);

  const seekOffset = useCallback((seconds: number) => {
    const video = videoRef.current;
    if (!video) return;
    const dur = duration || video.duration || 0;
    const target = Math.min(Math.max(0, video.currentTime + seconds), dur);
    video.currentTime = target;
    setCurrentTime(target);
    if (seconds > 0) {
      triggerToast(<RotateCw size={28} />, `+${seconds}s`);
    } else {
      triggerToast(<RotateCcw size={28} />, `${seconds}s`);
    }
  }, [duration, triggerToast]);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const nextMuted = !muted;
    video.muted = nextMuted;
    setMuted(nextMuted);
    if (nextMuted) {
      triggerToast(<VolumeX size={28} />, "Tắt tiếng");
    } else {
      const volPct = Math.round((video.volume || 1) * 100);
      triggerToast(<Volume2 size={28} />, `${volPct}%`);
    }
  }, [muted, triggerToast]);

  const handleVolumeChange = (newVol: number) => {
    const video = videoRef.current;
    if (!video) return;
    const clamped = Math.max(0, Math.min(1, newVol));
    video.volume = clamped;
    setVolume(clamped);
    if (clamped === 0) {
      video.muted = true;
      setMuted(true);
    } else if (muted) {
      video.muted = false;
      setMuted(false);
    }
  };

  // Xử lý bật / tắt toàn màn hình (Hỗ trợ chuẩn HTML5 Fullscreen API + Safari Webkit + iOS Video Fullscreen + Web Fullscreen fallback)
  const handleFullscreen = useCallback(async () => {
    const container = playerContainerRef.current;
    const video = videoRef.current;
    if (!container) return;

    const doc = document as any;
    const el = container as any;
    const vid = video as any;

    const isNativeFull = !!(
      doc.fullscreenElement ||
      doc.webkitFullscreenElement ||
      doc.mozFullScreenElement ||
      doc.msFullscreenElement
    );

    if (!isNativeFull && !isWebFullscreen) {
      // Yêu cầu toàn màn hình
      try {
        if (el.requestFullscreen) {
          await el.requestFullscreen();
        } else if (el.webkitRequestFullscreen) {
          await el.webkitRequestFullscreen();
        } else if (el.mozRequestFullScreen) {
          await el.mozRequestFullScreen();
        } else if (el.msRequestFullscreen) {
          await el.msRequestFullscreen();
        } else if (vid?.webkitEnterFullscreen) {
          // Dành riêng cho iPhone Safari
          vid.webkitEnterFullscreen();
        } else {
          setIsWebFullscreen(true);
        }
      } catch (err) {
        console.warn("Fullscreen request error, fallback to web fullscreen:", err);
        if (vid?.webkitEnterFullscreen) {
          try {
            vid.webkitEnterFullscreen();
          } catch {
            setIsWebFullscreen(true);
          }
        } else {
          setIsWebFullscreen(true);
        }
      }
    } else {
      // Thoát toàn màn hình
      if (isWebFullscreen) {
        setIsWebFullscreen(false);
      }
      try {
        if (doc.exitFullscreen) {
          await doc.exitFullscreen();
        } else if (doc.webkitExitFullscreen) {
          await doc.webkitExitFullscreen();
        } else if (doc.mozCancelFullScreen) {
          await doc.mozCancelFullScreen();
        } else if (doc.msExitFullscreen) {
          await doc.msExitFullscreen();
        }
      } catch (err) {
        console.warn("Exit fullscreen error:", err);
      }
    }
  }, [isWebFullscreen]);

  // Lắng nghe sự kiện thay đổi trạng thái fullscreen toàn hệ thống
  useEffect(() => {
    const handleFsChange = () => {
      const doc = document as any;
      const fsEl =
        doc.fullscreenElement ||
        doc.webkitFullscreenElement ||
        doc.mozFullScreenElement ||
        doc.msFullscreenElement;
      setIsFullscreen(!!fsEl);
      if (!fsEl && isWebFullscreen) {
        setIsWebFullscreen(false);
      }
    };

    const vid = videoRef.current as any;
    const onVideoBeginFs = () => setIsFullscreen(true);
    const onVideoEndFs = () => setIsFullscreen(false);

    document.addEventListener("fullscreenchange", handleFsChange);
    document.addEventListener("webkitfullscreenchange", handleFsChange);
    document.addEventListener("mozfullscreenchange", handleFsChange);
    document.addEventListener("MSFullscreenChange", handleFsChange);

    if (vid) {
      vid.addEventListener("webkitbeginfullscreen", onVideoBeginFs);
      vid.addEventListener("webkitendfullscreen", onVideoEndFs);
    }

    return () => {
      document.removeEventListener("fullscreenchange", handleFsChange);
      document.removeEventListener("webkitfullscreenchange", handleFsChange);
      document.removeEventListener("mozfullscreenchange", handleFsChange);
      document.removeEventListener("MSFullscreenChange", handleFsChange);
      if (vid) {
        vid.removeEventListener("webkitbeginfullscreen", onVideoBeginFs);
        vid.removeEventListener("webkitendfullscreen", onVideoEndFs);
      }
    };
  }, [isWebFullscreen]);

  // Đổi nhanh chế độ tỷ lệ khung hình (Fit / Fill / Stretch)
  const toggleVideoFit = useCallback(() => {
    setVideoFit((prev) => {
      const next = prev === "contain" ? "cover" : prev === "cover" ? "fill" : "contain";
      const label =
        next === "contain"
          ? "Vừa khung (Chuẩn gốc 16:9)"
          : next === "cover"
          ? "Tràn viền (Cắt viền đen)"
          : "Kéo giãn 100%";
      triggerToast(<Scaling size={28} />, label);
      return next;
    });
  }, [triggerToast]);

  // Đồng bộ URL trình duyệt khi đổi tập
  const syncUrlToEpisode = useCallback((epIdx: number) => {
    if (typeof window !== "undefined" && media && currentServer?.episodes[epIdx]) {
      const ep = currentServer.episodes[epIdx];
      const mediaKey = media.slug || media.id;
      const matchNum = ep.name?.match(/\d+/);
      const epNum = matchNum ? matchNum[0] : String(epIdx + 1);
      const isTV = media.mediaType === "tv" || window.location.pathname.includes("/watch/tv/");
      if (isTV) {
        const newUrl = `/watch/tv/${mediaKey}/1/${epNum}`;
        window.history.replaceState(null, "", newUrl);
      }
    }
  }, [media, currentServer]);

  const handleSelectEpisode = useCallback((serverIdx: number, episodeIdx: number) => {
    hasResumedRef.current = false;
    setResumeToast(null);
    setSwitchEpisodePrompt(null);
    setSelectedServerIdx(serverIdx);
    setSelectedEpisodeIdx(episodeIdx);
    setError(null);
    syncUrlToEpisode(episodeIdx);
    if (onEpisodeChange) {
      onEpisodeChange(serverIdx, episodeIdx);
    }
  }, [onEpisodeChange, syncUrlToEpisode]);

  // Chuyển tới tập tiếp theo
  const handleNextEpisode = useCallback(() => {
    if (!currentServer || selectedEpisodeIdx >= currentServer.episodes.length - 1) return;
    const nextIdx = selectedEpisodeIdx + 1;
    const nextEp = currentServer.episodes[nextIdx];
    handleSelectEpisode(selectedServerIdx, nextIdx);
    triggerToast(<SkipForward size={28} />, `Chuyển tới ${nextEp?.name || `Tập ${nextIdx + 1}`}`);
  }, [currentServer, selectedEpisodeIdx, selectedServerIdx, handleSelectEpisode, triggerToast]);

  // LẮNG NGHE PHÍM TẮT: SPACE ĐỂ DỪNG/PHÁT, MŨI TÊN ĐỂ TUA & TĂNG GIẢM ÂM LƯỢNG, N: TẬP TIẾP, Z: CẮT VIỀN ĐEN
  useEffect(() => {
    if (playerMode !== "hls") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl.tagName === "INPUT" ||
         activeEl.tagName === "TEXTAREA" ||
         (activeEl as HTMLElement).isContentEditable)
      ) {
        return;
      }

      const video = videoRef.current;
      if (!video) return;

      switch (e.code) {
        case "Space": {
          e.preventDefault();
          togglePlay();
          break;
        }
        case "ArrowLeft": {
          e.preventDefault();
          seekOffset(-10);
          break;
        }
        case "ArrowRight": {
          e.preventDefault();
          seekOffset(10);
          break;
        }
        case "ArrowUp": {
          e.preventDefault();
          const newVol = Math.min(1, Number((video.volume + 0.1).toFixed(2)));
          video.volume = newVol;
          video.muted = false;
          setVolume(newVol);
          setMuted(false);
          triggerToast(<Volume2 size={28} />, `${Math.round(newVol * 100)}%`);
          break;
        }
        case "ArrowDown": {
          e.preventDefault();
          const newVol = Math.max(0, Number((video.volume - 0.1).toFixed(2)));
          video.volume = newVol;
          setVolume(newVol);
          if (newVol === 0) {
            video.muted = true;
            setMuted(true);
            triggerToast(<VolumeX size={28} />, "0%");
          } else {
            triggerToast(<Volume2 size={28} />, `${Math.round(newVol * 100)}%`);
          }
          break;
        }
        case "KeyF": {
          e.preventDefault();
          handleFullscreen();
          break;
        }
        case "KeyM": {
          e.preventDefault();
          toggleMute();
          break;
        }
        case "KeyN": {
          e.preventDefault();
          handleNextEpisode();
          break;
        }
        case "KeyZ": {
          e.preventDefault();
          toggleVideoFit();
          break;
        }
        case "Escape": {
          if (isWebFullscreen) {
            e.preventDefault();
            setIsWebFullscreen(false);
          }
          break;
        }
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [playerMode, togglePlay, seekOffset, toggleMute, handleFullscreen, handleNextEpisode, toggleVideoFit, isWebFullscreen, triggerToast]);

  const handleSeek = (val: number) => {
    const video = videoRef.current;
    if (!video || !duration) return;
    const target = (val / 100) * duration;
    video.currentTime = target;
    setCurrentTime(target);
  };

  const handleSelectQuality = (lvlIndex: number) => {
    setSelectedQuality(lvlIndex);
    if (hlsRef.current) {
      hlsRef.current.currentLevel = lvlIndex;
    }
    const opt = qualityOptions.find(q => q.levelIndex === lvlIndex);
    triggerToast(<Sliders size={24} />, opt ? opt.label : "Tự động");
    setShowSettings(false);
    setSettingsView("main");
  };

  const handleSelectSpeed = (speed: number) => {
    setSelectedSpeed(speed);
    const video = videoRef.current;
    if (video) {
      video.playbackRate = speed;
    }
    triggerToast(<RefreshCw size={24} />, `${speed}x`);
    setShowSettings(false);
    setSettingsView("main");
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return "00:00";
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="player-wrapper">
      {/* Thanh chuyển đổi chế độ và Server */}
      <div className="player-top-bar">
        <div className="player-modes">
          <button 
            type="button"
            className={`mode-btn ${playerMode === "hls" ? "active" : ""}`}
            onClick={() => { setPlayerMode("hls"); setError(null); }}
            title="Phát trực tiếp luồng stream M3U8 với player QMovies"
          >
            <MonitorPlay size={15} />
            <span>Player HLS (M3U8)</span>
          </button>
          {currentEmbedUrl && (
            <button 
              type="button" 
              className={`mode-btn ${playerMode === "embed" ? "active" : ""}`}
              onClick={() => setPlayerMode("embed")}
              title="Nhúng trực tiếp player dự phòng của nhà cung cấp"
            >
              <Film size={15} />
              <span>Player Embed (Dự phòng)</span>
            </button>
          )}
        </div>

        {availableServers.length > 1 && (
          <div className="server-selector">
            <Server size={14} />
            <span>Server:</span>
            <div className="server-badges">
              {availableServers.map((srv, idx) => (
                <button
                  key={srv.serverName}
                  type="button"
                  className={`server-pill ${idx === selectedServerIdx ? "active" : ""}`}
                  onClick={() => handleSelectEpisode(idx, selectedEpisodeIdx)}
                >
                  {srv.serverName}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Vùng phát video */}
      <div 
        ref={playerContainerRef}
        className={`video-player ${isFullscreen ? "is-fullscreen" : ""} ${isWebFullscreen ? "is-web-fullscreen" : ""}`}
        onMouseMove={handleUserActivity}
        onMouseEnter={handleUserActivity}
        onMouseLeave={() => {
          if (playing && !showSettings) {
            setControlsVisible(false);
          }
        }}
      >
        {playerMode === "hls" ? (
          <>
            <video
              ref={videoRef}
              className={`player-video-media fit-${videoFit}`}
              preload="metadata"
              playsInline
              onClick={togglePlay}
              onDoubleClick={handleFullscreen}
            />

            {/* OSD Toast thông báo phím tắt giữa màn hình */}
            {toast && (
              <div className="player-toast-osd">
                <div className="toast-icon">{toast.icon}</div>
                {toast.text && <span className="toast-text">{toast.text}</span>}
              </div>
            )}

            {/* Toast khôi phục phát tiếp đoạn đã xem */}
            {resumeToast && (
              <div className="player-resume-toast">
                <div className="resume-content">
                  <Play size={15} fill="#f5c518" color="#f5c518" />
                  <span>
                    Đang phát tiếp từ <strong>{formatTime(resumeToast.time)}</strong>
                    {resumeToast.episodeName ? ` (${resumeToast.episodeName})` : ""}
                  </span>
                </div>
                <div className="resume-actions">
                  <button
                    type="button"
                    className="resume-btn-restart"
                    onClick={() => {
                      if (videoRef.current) {
                        videoRef.current.currentTime = 0;
                        setCurrentTime(0);
                      }
                      setResumeToast(null);
                      triggerToast(<RotateCcw size={28} />, "Phát từ đầu");
                    }}
                  >
                    Xem từ đầu
                  </button>
                  <button
                    type="button"
                    className="resume-btn-dismiss"
                    onClick={() => setResumeToast(null)}
                    aria-label="Đóng"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}

            {/* Nhắc chuyển tới tập đã xem trước đó (phim bộ) */}
            {switchEpisodePrompt && (
              <div className="player-resume-toast">
                <div className="resume-content">
                  <Film size={15} color="#f5c518" />
                  <span>
                    Hôm trước bạn đang xem <strong>{switchEpisodePrompt.episodeName}</strong> ({formatTime(switchEpisodePrompt.time)})
                  </span>
                </div>
                <div className="resume-actions">
                  <button
                    type="button"
                    className="resume-btn-restart"
                    onClick={() => {
                      handleSelectEpisode(switchEpisodePrompt.serverIdx, switchEpisodePrompt.episodeIdx);
                      setSwitchEpisodePrompt(null);
                    }}
                  >
                    Chuyển tới {switchEpisodePrompt.episodeName}
                  </button>
                  <button
                    type="button"
                    className="resume-btn-dismiss"
                    onClick={() => setSwitchEpisodePrompt(null)}
                    aria-label="Bỏ qua"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}

            {buffering && !error && (
              <div className="player-buffering">
                <RefreshCw className="animate-spin" size={32} />
                <span>Đang tải luồng phát...</span>
              </div>
            )}

            {error && (
              <div className="player-error">
                <AlertCircle size={24} />
                <strong>{error}</strong>
                {currentEmbedUrl && (
                  <button 
                    className="button primary" 
                    style={{ marginTop: 10, height: 36, fontSize: 12 }}
                    onClick={() => setPlayerMode("embed")}
                  >
                    Chuyển sang Player Embed ngay
                  </button>
                )}
              </div>
            )}

            {/* Thanh điều khiển video */}
            <div className={`video-controls ${controlsVisible || !playing || showSettings ? "visible" : ""}`}>
              {/* Thanh tua thời gian (Scrubber) hiện đại */}
              <div 
                className="player-scrubber-wrap"
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                  setScrubHoverTime(pct * duration);
                  setScrubHoverPos(e.clientX - rect.left);
                }}
                onMouseLeave={() => setScrubHoverTime(null)}
              >
                <div className="player-scrubber-track">
                  <div 
                    className="player-scrubber-progress" 
                    style={{ width: `${progressPercent}%` }}
                  >
                    <div className="player-scrubber-thumb" />
                  </div>
                </div>

                {scrubHoverTime !== null && duration > 0 && (
                  <div 
                    className="player-scrubber-tooltip"
                    style={{ left: `${scrubHoverPos}px` }}
                  >
                    {formatTime(scrubHoverTime)}
                  </div>
                )}

                <input
                  aria-label="Tiến trình phát"
                  type="range"
                  min="0"
                  max="100"
                  step="0.1"
                  value={progressPercent}
                  onChange={(e) => handleSeek(Number(e.target.value))}
                  className="player-scrubber-input"
                />
              </div>

              {/* Hàng nút bấm chia 2 bên: Trái (Phát, Tua 10s, Tập tiếp theo, Âm lượng, Thời gian) - Phải (Nút Tập tiếp, Server badge, Khung hình, Cài đặt ⚙️, Toàn màn hình ⛶) */}
              <div className="controls-row">
                <div className="controls-left">
                  {/* Nút Play / Pause */}
                  <button 
                    type="button" 
                    onClick={togglePlay} 
                    className="control-btn"
                    aria-label={playing ? "Tạm dừng" : "Phát"} 
                    title={playing ? "Tạm dừng (Space)" : "Phát (Space)"}
                  >
                    {playing ? <Pause fill="currentColor" size={20} /> : <Play fill="currentColor" size={20} />}
                  </button>

                  {/* Nút Tua lùi 10s */}
                  <button 
                    type="button" 
                    onClick={() => seekOffset(-10)} 
                    className="control-btn seek-control-btn"
                    title="Tua lùi 10 giây (Mũi tên trái)" 
                    aria-label="Tua lùi 10 giây"
                  >
                    <RotateCcw size={19} />
                    <span className="seek-num">10</span>
                  </button>

                  {/* Nút Tua tới 10s */}
                  <button 
                    type="button" 
                    onClick={() => seekOffset(10)} 
                    className="control-btn seek-control-btn"
                    title="Tua tới 10 giây (Mũi tên phải)" 
                    aria-label="Tua tới 10 giây"
                  >
                    <RotateCw size={19} />
                    <span className="seek-num">10</span>
                  </button>

                  {/* Nút Chuyển tập tiếp theo (dạng icon) ở cụm điều khiển trái nếu là phim bộ */}
                  {hasNextEpisode && (
                    <button 
                      type="button" 
                      onClick={handleNextEpisode} 
                      className="control-btn next-control-btn"
                      title={`Tập tiếp theo: ${nextEpisode?.name || `Tập ${selectedEpisodeIdx + 2}`} (Phím N)`} 
                      aria-label="Tập tiếp theo"
                    >
                      <SkipForward size={19} fill="currentColor" />
                    </button>
                  )}

                  {/* Cụm điều khiển âm lượng */}
                  <div className="volume-control-wrap">
                    <button 
                      type="button" 
                      onClick={toggleMute} 
                      className="control-btn"
                      aria-label={muted || volume === 0 ? "Bật âm thanh" : "Tắt âm thanh"} 
                      title={muted || volume === 0 ? "Bật tiếng (M)" : "Tắt tiếng (M)"}
                    >
                      {muted || volume === 0 ? <VolumeX size={19} /> : <Volume2 size={19} />}
                    </button>
                    <input
                      type="range"
                      className="volume-slider-bar"
                      min="0"
                      max="1"
                      step="0.05"
                      value={muted ? 0 : volume}
                      onChange={(e) => handleVolumeChange(Number(e.target.value))}
                      aria-label="Thanh âm lượng (Mũi tên lên/xuống)"
                    />
                  </div>

                  {/* Hiển thị thời lượng */}
                  <span className="time-display">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>

                <div className="controls-right">
                  {/* Nút Tập tiếp theo dạng pill nổi bật nếu là phim nhiều tập */}
                  {hasNextEpisode && (
                    <button
                      type="button"
                      className="next-episode-pill-btn"
                      onClick={handleNextEpisode}
                      title={`Chuyển sang ${nextEpisode?.name || `Tập ${selectedEpisodeIdx + 2}`} (Phím N)`}
                      aria-label="Mở tập tiếp theo"
                    >
                      <SkipForward size={13} fill="currentColor" />
                      <span className="next-ep-text-full">
                        Tập tiếp theo{nextEpisode?.name ? ` • ${nextEpisode.name}` : ""}
                      </span>
                      <span className="next-ep-text-short">Tập tiếp</span>
                    </button>
                  )}

                  <span className="source-badge">
                    {currentServer ? `${currentServer.serverName} • ` : ""}{currentEpisodeName}
                  </span>

                  {/* Nút đổi nhanh tỷ lệ khung hình / cắt viền đen */}
                  <button
                    type="button"
                    className={`control-btn fit-toggle-btn ${videoFit !== "contain" ? "active" : ""}`}
                    onClick={toggleVideoFit}
                    title={`Chế độ khung hình: ${
                      videoFit === "contain"
                        ? "Vừa khung (Gốc 16:9)"
                        : videoFit === "cover"
                        ? "Tràn viền (Cắt viền đen)"
                        : "Kéo giãn 100%"
                    } (Phím Z)`}
                    aria-label="Đổi tỷ lệ hiển thị"
                  >
                    <Scaling size={18} />
                  </button>

                  {/* Menu Cài đặt chất lượng & Tốc độ phát */}
                  <div className="player-settings-wrapper" ref={settingsRef}>
                    <button 
                      type="button" 
                      className={`control-btn player-control-icon ${showSettings ? "active" : ""}`}
                      onClick={() => {
                        setShowSettings(!showSettings);
                        setSettingsView("main");
                      }}
                      title="Cài đặt chất lượng & tốc độ phát"
                      aria-label="Cài đặt phát video"
                    >
                      <Settings size={19} />
                    </button>

                    {showSettings && (
                      <div className="player-settings-popup">
                        {settingsView === "main" && (
                          <div className="settings-list">
                            <div className="settings-header">Cài đặt phát</div>
                            <button 
                              type="button" 
                              className="settings-item"
                              onClick={() => setSettingsView("quality")}
                            >
                              <div className="settings-item-left">
                                <Sliders size={15} />
                                <span>Chất lượng</span>
                              </div>
                              <div className="settings-item-right">
                                <span>{qualityOptions.find(q => q.levelIndex === selectedQuality)?.label || "Tự động"}</span>
                                <ChevronRight size={14} />
                              </div>
                            </button>

                            <button 
                              type="button" 
                              className="settings-item"
                              onClick={() => setSettingsView("speed")}
                            >
                              <div className="settings-item-left">
                                <RefreshCw size={15} />
                                <span>Tốc độ phát</span>
                              </div>
                              <div className="settings-item-right">
                                <span>{selectedSpeed === 1 ? "Chuẩn (1x)" : `${selectedSpeed}x`}</span>
                                <ChevronRight size={14} />
                              </div>
                            </button>

                            <button 
                              type="button" 
                              className="settings-item"
                              onClick={() => setSettingsView("aspectRatio")}
                            >
                              <div className="settings-item-left">
                                <Scaling size={15} />
                                <span>Khung hình</span>
                              </div>
                              <div className="settings-item-right">
                                <span>
                                  {videoFit === "contain"
                                    ? "Vừa khung"
                                    : videoFit === "cover"
                                    ? "Tràn viền (Cắt viền đen)"
                                    : "Kéo giãn"}
                                </span>
                                <ChevronRight size={14} />
                              </div>
                            </button>
                          </div>
                        )}

                        {settingsView === "quality" && (
                          <div className="settings-list">
                            <button 
                              type="button" 
                              className="settings-back-header"
                              onClick={() => setSettingsView("main")}
                            >
                              <ChevronLeft size={16} />
                              <span>Chất lượng video</span>
                            </button>
                            <div className="settings-sub-options">
                              {qualityOptions.map((opt) => {
                                const isSelected = selectedQuality === opt.levelIndex;
                                return (
                                  <button
                                    key={`qual-${opt.levelIndex}-${opt.label}`}
                                    type="button"
                                    className={`settings-sub-item ${isSelected ? "active" : ""}`}
                                    onClick={() => handleSelectQuality(opt.levelIndex)}
                                  >
                                    <span className="check-indicator">
                                      {isSelected ? <Check size={14} /> : null}
                                    </span>
                                    <span>{opt.label}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {settingsView === "speed" && (
                          <div className="settings-list">
                            <button 
                              type="button" 
                              className="settings-back-header"
                              onClick={() => setSettingsView("main")}
                            >
                              <ChevronLeft size={16} />
                              <span>Tốc độ phát</span>
                            </button>
                            <div className="settings-sub-options">
                              {[0.5, 0.75, 1, 1.25, 1.5, 2].map((spd) => {
                                const isSelected = selectedSpeed === spd;
                                return (
                                  <button
                                    key={`spd-${spd}`}
                                    type="button"
                                    className={`settings-sub-item ${isSelected ? "active" : ""}`}
                                    onClick={() => handleSelectSpeed(spd)}
                                  >
                                    <span className="check-indicator">
                                      {isSelected ? <Check size={14} /> : null}
                                    </span>
                                    <span>{spd === 1 ? "Chuẩn (1x)" : `${spd}x`}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {settingsView === "aspectRatio" && (
                          <div className="settings-list">
                            <button 
                              type="button" 
                              className="settings-back-header"
                              onClick={() => setSettingsView("main")}
                            >
                              <ChevronLeft size={16} />
                              <span>Tỷ lệ hiển thị</span>
                            </button>
                            <div className="settings-sub-options">
                              {[
                                { id: "contain", label: "Vừa màn hình (Chuẩn gốc 16:9)" },
                                { id: "cover", label: "Tràn viền (Cắt viền đen / Zoom to Fill)" },
                                { id: "fill", label: "Kéo giãn lấp đầy khung hình (Stretch)" },
                              ].map((item) => {
                                const isSelected = videoFit === item.id;
                                return (
                                  <button
                                    key={`fit-${item.id}`}
                                    type="button"
                                    className={`settings-sub-item ${isSelected ? "active" : ""}`}
                                    onClick={() => {
                                      setVideoFit(item.id as "contain" | "cover" | "fill");
                                      triggerToast(<Scaling size={24} />, item.label);
                                      setShowSettings(false);
                                      setSettingsView("main");
                                    }}
                                  >
                                    <span className="check-indicator">
                                      {isSelected ? <Check size={14} /> : null}
                                    </span>
                                    <span>{item.label}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Toàn màn hình */}
                  <button 
                    type="button" 
                    className="control-btn fullscreen" 
                    onClick={handleFullscreen} 
                    aria-label={isFullscreen || isWebFullscreen ? "Thoát toàn màn hình" : "Toàn màn hình"} 
                    title={isFullscreen || isWebFullscreen ? "Thoát toàn màn hình (F hoặc Esc)" : "Toàn màn hình (F)"}
                  >
                    {isFullscreen || isWebFullscreen ? <Minimize size={19} /> : <Expand size={19} />}
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="embed-container">
            {currentEmbedUrl ? (
              <iframe
                src={currentEmbedUrl}
                title={source.title || "Video Player"}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="embed-iframe"
              />
            ) : (
              <div className="player-error">
                <AlertCircle size={22} />
                <strong>Không có link nhúng (Embed)</strong>
                <span>Vui lòng chuyển lại sang chế độ Player HLS (M3U8).</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Danh sách tập phim nếu có nhiều tập */}
      {currentServer && currentServer.episodes.length > 1 && (
        <div className="episode-selector-panel">
          <div className="episode-panel-header">
            <h3>Danh sách tập phim ({currentServer.episodes.length} tập)</h3>
            <span className="current-badge">Đang xem: {currentEpisodeName}</span>
          </div>
          <div className="episode-grid">
            {currentServer.episodes.map((ep, idx) => (
              <button
                key={ep.slug}
                type="button"
                className={`ep-btn ${idx === selectedEpisodeIdx ? "active" : ""}`}
                onClick={() => handleSelectEpisode(selectedServerIdx, idx)}
              >
                {ep.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
