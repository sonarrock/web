document.addEventListener("DOMContentLoaded", () => {

  const audio = document.getElementById("radioPlayer");
  const playBtn = document.getElementById("playBtn");
  const playIcon = document.getElementById("playIcon");

  const trackInfo = document.getElementById("trackInfo");
  const trackArtist = document.getElementById("trackArtist");
  const stationCover = document.getElementById("stationCover");
  const statusText = document.getElementById("statusText");

  if (!audio || !playBtn) return;

  // ================= CONFIG =================
const STREAM_URL = "https://giss.tv:667/sonarrock.mp3";
const API_URL = "/api/nowplaying.php";
const FALLBACK_URL = "https://giss.tv/player/playing.php?mp=sonarrock.mp3";

const DEFAULT_TRACK = "Transmitiendo rock sin concesiones";
const DEFAULT_ARTIST = "SONAR ROCK";
const DEFAULT_COVER = "attached_assets/logo_1749601460841.jpeg";
  
  let isPlaying = false;
  let lastTitle = "";
  let metadataTimer = null;
  let retryCount = 0;

  // ================= AUDIO FIX iOS =================
  audio.preload = "none";
  audio.setAttribute("playsinline", "");
  audio.setAttribute("webkit-playsinline", "");
  audio.crossOrigin = "anonymous";

  // ================= UI =================
  function setStatus(text) {
    if (statusText) statusText.textContent = text;
  }

  function updatePlayUI(playing) {
    isPlaying = playing;
    if (playIcon) playIcon.textContent = playing ? "❚❚" : "▶";
  }

  function updateTrack(title, artist) {
    if (trackInfo) trackInfo.textContent = title;
    if (trackArtist) trackArtist.textContent = artist;
  }

  function setCover(url) {
    if (stationCover) stationCover.src = url || DEFAULT_COVER;
  }

  function showToast(text) {
    const toast = document.getElementById("songToast");
    if (!toast) return;
    toast.textContent = text;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 3000);
  }

  // ================= PARSE =================
  function parseTitle(text = "") {
    try {
      text = decodeURIComponent(text).trim();
    } catch {}

    if (!text || text === "-") {
      return { artist: DEFAULT_ARTIST, title: DEFAULT_TRACK };
    }

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

  // ================= METADATA =================
  async function fetchMetadata() {
    try {
      const res = await fetch(API_URL + "?t=" + Date.now(), {
        cache: "no-store"
      });

      if (!res.ok) throw new Error("API fail");

      const data = await res.json();

      if (!data?.title) throw new Error("No data");

      if (data.title === lastTitle) return;

      lastTitle = data.title;
      retryCount = 0;

      const artist = data.artist || DEFAULT_ARTIST;
      const cover = data.cover || DEFAULT_COVER;

      updateTrack(data.title, artist);
      setCover(cover);
      updateMediaSession(data.title, artist, cover);
      showToast(`${artist} - ${data.title}`);

    } catch (e) {
      fallbackMetadata();
    }
  }

  // ================= FALLBACK =================
  async function fallbackMetadata() {
    try {
      const res = await fetch(FALLBACK_URL + "&t=" + Date.now(), {
        cache: "no-store"
      });

      const text = await res.text();

      if (!text || text === "-" || text === lastTitle) return;

      lastTitle = text;

      const parsed = parseTitle(text);

      updateTrack(parsed.title, parsed.artist);
      setCover(DEFAULT_COVER);
      updateMediaSession(parsed.title, parsed.artist, DEFAULT_COVER);
      showToast(`${parsed.artist} - ${parsed.title}`);

    } catch {
      retryCount++;
      if (retryCount < 5) {
        setTimeout(fetchMetadata, 2000);
      }
    }
  }

  function startMetadata() {
    if (metadataTimer) clearInterval(metadataTimer);

    fetchMetadata();
    metadataTimer = setInterval(fetchMetadata, 5000);
  }

  function stopMetadata() {
    if (metadataTimer) clearInterval(metadataTimer);
  }

  // ================= PLAY =================
  async function playStream() {
    try {
      setStatus("Conectando...");

      audio.src = STREAM_URL + "?t=" + Date.now();
      audio.load();

      await audio.play();

      updatePlayUI(true);
      setStatus("En vivo");

      startMetadata();

    } catch {
      setStatus("Toca reproducir");
      updatePlayUI(false);
    }
  }

  function pauseStream() {
    audio.pause();
    stopMetadata();
    updatePlayUI(false);
    setStatus("Pausado");
  }

  function togglePlay() {
    isPlaying ? pauseStream() : playStream();
  }

  playBtn.addEventListener("click", togglePlay);

  // ================= EVENTOS (CLAVE EN iOS) =================
  audio.addEventListener("playing", () => setStatus("En vivo"));
  audio.addEventListener("waiting", () => isPlaying && setStatus("Bufferizando..."));
  audio.addEventListener("error", () => setStatus("Error de señal"));

  // ================= INIT =================
  updateTrack(DEFAULT_TRACK, DEFAULT_ARTIST);
  setCover(DEFAULT_COVER);
  updatePlayUI(false);

});
