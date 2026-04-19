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
  const API_URL = "https://sonarrock-api.cmrm1982.workers.dev/";
  const FALLBACK_URL = "https://giss.tv/player/playing.php?mp=sonarrock.mp3";

  const DEFAULT_TRACK = "Transmitiendo rock sin concesiones";
  const DEFAULT_ARTIST = "SONAR ROCK";
  const DEFAULT_COVER = window.location.origin + "/attached_assets/logo_1749601460841.jpeg";

  let isPlaying = false;
  let lastTitle = "";
  let metadataTimer = null;

  // ================= AUDIO FIX iOS =================
  audio.preload = "none";
  audio.setAttribute("playsinline", "");
  audio.setAttribute("webkit-playsinline", "");
  audio.crossOrigin = "anonymous";

  // ================= STATUS =================
  function setStatus(state) {
    const map = {
      loading: "Conectando...",
      live: "En vivo",
      buffering: "Bufferizando...",
      paused: "Pausado",
      error: "Sin señal",
      ready: "Listo"
    };

    if (statusText) statusText.textContent = map[state] || state;
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

  // ================= PORTADA FIX iPHONE =================
  function setCover(url) {
  if (!stationCover) return;

  const clean = url
    .replace("http://", "https://")
    .split("?")[0];

  stationCover.src = clean + "?t=" + Date.now();

  stationCover.onerror = () => {
    stationCover.src = DEFAULT_COVER;
  };
}
  
  // ================= TOAST =================
  function showToast(text) {
    const toast = document.getElementById("songToast");
    const span = document.getElementById("toastSong");

    if (!toast || !span) return;

    span.textContent = text;
    toast.classList.add("show");

    setTimeout(() => toast.classList.remove("show"), 3000);
  }

  // ================= LIMPIEZA TEXTO =================
  function cleanText(text = "") {
    try { text = decodeURIComponent(text); } catch {}
    return text
      .replace(/\+/g, " ")
      .replace(/%20/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function parseTitle(text = "") {
    text = cleanText(text);

    if (!text || text === "-") {
      return { artist: DEFAULT_ARTIST, title: DEFAULT_TRACK };
    }

    if (text.includes(" - ")) {
      const [artist, ...rest] = text.split(" - ");
      return {
        artist: cleanText(artist),
        title: cleanText(rest.join(" - "))
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

  // ================= COVER FETCH =================
  async function fetchCover(artist, title) {
    try {
      const query = encodeURIComponent(`${artist} ${title}`);

      const res = await fetch(
        `https://itunes.apple.com/search?term=${query}&limit=1`,
        { cache: "no-store" }
      );

      const data = await res.json();

      if (data.results?.[0]?.artworkUrl100) {
        return data.results[0].artworkUrl100.replace("100x100bb", "600x600bb");
      }

    } catch {}

    return DEFAULT_COVER;
  }

  // ================= METADATA =================
  async function fetchMetadata() {
  try {
    const res = await fetch(API_URL + "?t=" + Date.now(), {
      cache: "no-store"
    });

    const data = await res.json();

    if (!data?.title) return;

    const title = data.title;
    const artist = data.artist;

    if (title === lastTitle) return;
    lastTitle = title;

    updateTrack(title, artist);

    // 🔥 CLAVE: usa directamente cover del worker
    setCover(data.cover);

    updateMediaSession(title, artist, data.cover);
    showToast(`${artist} - ${title}`);

  } catch (e) {
    console.warn("Worker error", e);
  }
}
  
  // ================= FALLBACK =================
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

      audio.src = STREAM_URL + "?t=" + Date.now(); // 🔥 clave iPhone
      audio.load();

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
  audio.addEventListener("waiting", () => isPlaying && setStatus("buffering"));
  audio.addEventListener("error", () => setStatus("error"));

  // ================= INIT =================
  updateTrack(DEFAULT_TRACK, DEFAULT_ARTIST);
  setCover(DEFAULT_COVER);
  updatePlayUI(false);
  setStatus("ready");

});
