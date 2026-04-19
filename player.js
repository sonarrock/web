```javascript
document.addEventListener("DOMContentLoaded", () => {

  // ================= ELEMENTOS =================
  const audio = document.getElementById("radioPlayer");
  const playBtn = document.getElementById("playBtn");
  const playIcon = document.getElementById("playIcon");

  const miniPlayBtn = document.getElementById("miniPlayBtn");
  const miniPlayIcon = document.getElementById("miniPlayIcon");

  const trackInfo = document.getElementById("trackInfo");
  const trackArtist = document.getElementById("trackArtist");
  const stationCover = document.getElementById("stationCover");
  const statusText = document.getElementById("statusText");

  if (!audio || !playBtn) return;

  // ================= CONFIG =================
  const STREAM_URL = "https://giss.tv:667/sonarrock.mp3";
  const API_URL = window.location.origin + "/api/nowplaying.php";
  const FALLBACK_URL = "https://giss.tv/player/playing.php?mp=sonarrock.mp3";

  const DEFAULT_TRACK = "Transmitiendo rock sin concesiones";
  const DEFAULT_ARTIST = "SONAR ROCK";
  const DEFAULT_COVER = "attached_assets/logo_1749601460841.jpeg";

  let isPlaying = false;
  let lastTitle = "";
  let metadataTimer = null;

  // ================= AUDIO (iOS FIX) =================
  audio.preload = "none";
  audio.setAttribute("playsinline", "");
  audio.setAttribute("webkit-playsinline", "");
  audio.crossOrigin = "anonymous";

  // ================= STATUS LIVE =================
  function setStatus(state) {
    const map = {
      loading: "Conectando...",
      live: "En vivo",
      buffering: "Bufferizando...",
      paused: "Pausado",
      error: "Sin señal",
      ready: "Listo para reproducir"
    };

    const text = map[state] || state;

    // textos
    if (statusText) statusText.textContent = text;

    const miniStatus = document.getElementById("miniStatus");
    if (miniStatus) miniStatus.textContent = text;

    // dots
    const dot = document.getElementById("statusDot");
    const miniDot = document.getElementById("miniLiveDot");

    [dot, miniDot].forEach(el => {
      if (!el) return;

      el.classList.remove("live", "connecting", "offline");

      if (state === "live") el.classList.add("live");
      else if (state === "loading" || state === "buffering") el.classList.add("connecting");
      else el.classList.add("offline");
    });
  }

  // ================= UI =================
  function updatePlayUI(playing) {
    isPlaying = playing;

    if (playIcon) playIcon.textContent = playing ? "❚❚" : "▶";
    if (miniPlayIcon) miniPlayIcon.textContent = playing ? "❚❚" : "▶";
  }

  function updateTrack(title, artist) {
    if (trackInfo) trackInfo.textContent = title;
    if (trackArtist) trackArtist.textContent = artist;
  }

  function setCover(url) {
    if (!stationCover) return;
    const clean = url ? url.split("?")[0] : DEFAULT_COVER;
    stationCover.src = clean + "?t=" + Date.now();
  }

  function showToast(text) {
    const toast = document.getElementById("songToast");
    const span = document.getElementById("toastSong");

    if (!toast || !span) return;

    span.textContent = text;
    toast.classList.add("show");

    setTimeout(() => toast.classList.remove("show"), 3000);
  }

  // ================= PARSE =================
  function parseTitle(text = "") {
    try { text = decodeURIComponent(text).trim(); } catch {}

    if (!text || text === "-") {
      return { artist: DEFAULT_ARTIST, title: DEFAULT_TRACK };
    }

    text = text.replace(/\+/g, " ");

    if (text.includes(" - ")) {
      const [artist, ...rest] = text.split(" - ");
      return {
        artist: artist.trim(),
        title: rest.join(" - ").trim()
      };
    }

    return { artist: DEFAULT_ARTIST, title: text };
  }

  // ================= MEDIA SESSION =================
  function updateMediaSession(title, artist, cover) {
    if (!("mediaSession" in navigator)) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title,
      artist,
      album: "Sonar Rock",
      artwork: [{ src: cover, sizes: "512x512", type: "image/png" }]
    });
  }

  // ================= COVER =================
  async function fetchCover(artist, title) {
    try {
      const controller = new AbortController();
      setTimeout(() => controller.abort(), 3000);

      const query = encodeURIComponent(`${artist} ${title}`);
      const res = await fetch(`https://itunes.apple.com/search?term=${query}&limit=1`, {
        signal: controller.signal
      });

      const data = await res.json();

      if (data.results?.[0]) {
        return data.results[0].artworkUrl100.replace("100x100bb", "600x600bb");
      }
    } catch {}

    return DEFAULT_COVER;
  }

  // ================= METADATA =================
  async function fetchMetadata() {
    try {
      const res = await fetch(API_URL + "?t=" + Date.now(), { cache: "no-store" });
      const data = await res.json();

      if (!data?.title) return;

      const parsed = parseTitle(data.title);

      const artist = data.artist || parsed.artist;
      const title = parsed.title;

      if (title === lastTitle) return;
      lastTitle = title;

      updateTrack(title, artist);

      const cover = await fetchCover(artist, title);
      setCover(cover);

      updateMediaSession(title, artist, cover);
      showToast(`${artist} - ${title}`);

    } catch {
      fallbackMetadata();
    }
  }

  async function fallbackMetadata() {
    try {
      const res = await fetch(FALLBACK_URL + "&t=" + Date.now(), { cache: "no-store" });
      const text = await res.text();

      if (!text || text === "-" || text === lastTitle) return;

      const parsed = parseTitle(text);

      lastTitle = parsed.title;

      updateTrack(parsed.title, parsed.artist);
      setCover(DEFAULT_COVER);
      updateMediaSession(parsed.title, parsed.artist, DEFAULT_COVER);
      showToast(`${parsed.artist} - ${parsed.title}`);

    } catch {}
  }

  function startMetadata() {
    stopMetadata();
    fetchMetadata();
    metadataTimer = setInterval(fetchMetadata, 6000);
  }

  function stopMetadata() {
    if (metadataTimer) {
      clearInterval(metadataTimer);
      metadataTimer = null;
    }
  }

  // ================= PLAY =================
  async function playStream() {
    try {
      setStatus("loading");

      if (!audio.src) {
        audio.src = STREAM_URL;
      }

      await audio.play();

      updatePlayUI(true);
      setStatus("live");

      startMetadata();

    } catch {
      setStatus("ready");
      updatePlayUI(false);
    }
  }

  function pauseStream() {
    audio.pause();
    stopMetadata();
    updatePlayUI(false);
    setStatus("paused");
  }

  function togglePlay() {
    isPlaying ? pauseStream() : playStream();
  }

  playBtn.addEventListener("click", togglePlay);
  if (miniPlayBtn) miniPlayBtn.addEventListener("click", togglePlay);

  // ================= EVENTOS =================
  audio.addEventListener("playing", () => setStatus("live"));

  audio.addEventListener("waiting", () => {
    if (isPlaying) setStatus("buffering");
  });

  audio.addEventListener("error", () => setStatus("error"));

  // ================= INIT =================
  updateTrack(DEFAULT_TRACK, DEFAULT_ARTIST);
  setCover(DEFAULT_COVER);
  updatePlayUI(false);
  setStatus("ready");

});
```
