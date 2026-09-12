self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Cho phép PWA cài đặt nhưng KHÔNG can thiệp/chặn các luồng phát video, media, Range requests.
// Trên iOS Safari & PWA Standalone WebKit, can thiệp vào fetch media bằng Service Worker
// sẽ làm hỏng khả năng stream HLS m3u8 và các phân đoạn video .ts/.mp4.
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  // Bỏ qua tuyệt đối các yêu cầu video, audio, media, range header, streaming
  if (
    req.destination === "video" ||
    req.destination === "audio" ||
    req.headers.has("range") ||
    /\.(m3u8|ts|mp4|m4s|webm|aac|mp3)([?#]|$)/i.test(req.url)
  ) {
    return;
  }
});
