
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

  const DEFAULT_TRACK = "Transmitiendo rock sin payola";
  const DEFAULT_ARTIST = "SONAR ROCK";
  const DEFAULT_COVER = window.location.origin + "/attached_assets/logo_1749601460841.jpeg";

  let isPlaying = false;
  let lastUpdated = 0;
  let metadataTimer = null;

  // ================= AUDIO =================
  audio.preload = "none";
  audio.setAttribute("playsinline", "");
  audio.setAttribute("webkit-playsinline", "");

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

  // ================= COVER =================
  function setCover(url) {
    if (!stationCover) return;

    const fallback = DEFAULT_COVER;
    const finalUrl = url || fallback;

    const img = new Image();

    img.onload = () => {
      const cacheBust = finalUrl + "?v=" + Date.now();
      stationCover.src = cacheBust;

      const player = document.querySelector(".sonar-player");
      if (player) {
        player.style.setProperty("--dynamic-bg", `url('${cacheBust}')`);
      }
    };

    img.onerror = () => {
      stationCover.src = fallback;
    };

    img.src = finalUrl;
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

  // ================= CLEAN =================
  function cleanText(text = "") {
    try { text = decodeURIComponent(text); } catch {}

    return text
      .replace(/\+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  // ================= METADATA (FIX REAL) =================
  async function fetchNowPlaying() {
    try {
      const res = await fetch(API_URL + "?t=" + Date.now(), {
        cache: "no-store"
      });

      if (!res.ok) return;

      const data = await res.json();
      if (!data?.title) return;

      const artist = cleanText(data.artist || DEFAULT_ARTIST);
      const title = cleanText(data.title);

      // 🔥 FIX IMPORTANTE: usar updated del worker
      const updated = data.updated || 0;

    const current = artist + " - " + title;

if (current === lastTrack && cover) return;
lastTrack = current;

      updateTrack(title, artist);

      const cover = data.cover || DEFAULT_COVER;

      setCover(cover);
      updateMediaSession(title, artist, cover);

      // toast opcional
      const toast = document.getElementById("songToast");
      const span = document.getElementById("toastSong");

      if (toast && span) {
        span.textContent = artist + " - " + title;
        toast.classList.add("show");
        setTimeout(() => toast.classList.remove("show"), 3000);
      }

    } catch (e) {
      console.warn("metadata error:", e);
    }
  }

  // ================= LOOP =================
  function startMetadata() {
    stopMetadata();
    fetchNowPlaying();
    metadataTimer = setInterval(fetchNowPlaying, 5000);
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

      audio.src = STREAM_URL + "?t=" + Date.now();
      audio.load();
      await audio.play();

      updatePlayUI(true);
      setStatus("live");
      startMetadata();

    } catch (e) {
      console.warn("Play error:", e);
      setStatus("ready");
      updatePlayUI(false);
    }
  }

  function pauseStream() {
    audio.pause();
    audio.src = "";
    stopMetadata();
    updatePlayUI(false);
    setStatus("paused");
  }

  function togglePlay() {
    isPlaying ? pauseStream() : playStream();
  }

  // ================= EVENTS =================
  playBtn.addEventListener("click", togglePlay);
  if (miniPlayBtn) miniPlayBtn.addEventListener("click", togglePlay);

  audio.addEventListener("playing", () => setStatus("live"));
  audio.addEventListener("waiting", () => isPlaying && setStatus("buffering"));
  audio.addEventListener("error", () => {
    setStatus("error");
    updatePlayUI(false);
    stopMetadata();
  });

  // ================= INIT =================
  updateTrack(DEFAULT_TRACK, DEFAULT_ARTIST);
  setCover(DEFAULT_COVER);
  updatePlayUI(false);
  setStatus("ready");

});
