document.addEventListener("DOMContentLoaded", () => {

  const audio = document.getElementById("radioPlayer");
  const playBtn = document.getElementById("playBtn");
  const playIcon = document.getElementById("playIcon");

  const trackInfo = document.getElementById("trackInfo");
  const trackArtist = document.getElementById("trackArtist");
  const stationCover = document.getElementById("stationCover");

  const statusText = document.getElementById("statusText");
  const historyContainer = document.getElementById("historyList");

  if (!audio || !playBtn) return;

  // =========================
  // CONFIG
  // =========================
  const STREAM_URL = "https://giss.tv:667/sonarrock.mp3";
  const API_URL = "/api/nowplaying.php";
  const FALLBACK_URL = "https://giss.tv/player/playing.php?mp=sonarrock.mp3";

  const DEFAULT_TRACK = "Transmitiendo rock sin concesiones";
  const DEFAULT_ARTIST = "SONAR ROCK";
  const DEFAULT_COVER = "attached_assets/logo_1749601460841.jpeg";

  const HISTORY_LIMIT = 8;

  // =========================
  // STATE
  // =========================
  let isPlaying = false;
  let metadataTimer = null;
  let lastTitle = "";
  let trackHistory = [];

  // =========================
  // AUDIO SETUP
  // =========================
  audio.preload = "none";
  audio.setAttribute("playsinline", "");
  audio.setAttribute("webkit-playsinline", "");

  // =========================
  // UI
  // =========================
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
    if (!stationCover) return;
    stationCover.src = url || DEFAULT_COVER;
  }

  // =========================
  // TOAST
  // =========================
  function showToast(text) {
    const toast = document.getElementById("songToast");
    if (!toast) return;

    toast.textContent = text;
    toast.classList.add("show");

    setTimeout(() => toast.classList.remove("show"), 3000);
  }

  // =========================
  // HISTORIAL
  // =========================
  function addToHistory(artist, title, cover) {
    const key = `${artist} - ${title}`;

    if (trackHistory[0]?.key === key) return;

    trackHistory.unshift({ key, artist, title, cover });

    if (trackHistory.length > HISTORY_LIMIT) {
      trackHistory.pop();
    }

    renderHistory();
  }

  function renderHistory() {
    if (!historyContainer) return;

    historyContainer.innerHTML = trackHistory.map(track => `
      <div class="history-item">
        <img src="${track.cover}" />
        <div>
          <div class="h-title">${track.title}</div>
          <div class="h-artist">${track.artist}</div>
        </div>
      </div>
    `).join("");
  }

  // =========================
  // PARSE
  // =========================
  function parseTitle(text = "") {
    text = decodeURIComponent(text || "").trim();

    if (!text || text === "-" || text.length < 3) {
      return { artist: DEFAULT_ARTIST, title: DEFAULT_TRACK };
    }

    const separators = [" - ", " – ", " — "];

    for (const sep of separators) {
      if (text.includes(sep)) {
        const parts = text.split(sep);
        return {
          artist: parts[0].trim(),
          title: parts.slice(1).join(" - ").trim()
        };
      }
    }

    return { artist: DEFAULT_ARTIST, title: text };
  }

  // =========================
  // MEDIA SESSION (LOCKSCREEN)
  // =========================
  function updateMediaSession(title, artist, cover) {
    if (!("mediaSession" in navigator)) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title,
      artist,
      album: "Sonar Rock",
      artwork: [{ src: cover, sizes: "512x512", type: "image/png" }]
    });

    navigator.mediaSession.setActionHandler("play", playStream);
    navigator.mediaSession.setActionHandler("pause", pauseStream);
  }

  // =========================
  // METADATA (API + FALLBACK)
  // =========================
  async function fetchMetadata() {
    try {
      const res = await fetch(API_URL + "?t=" + Date.now(), {
        cache: "no-store"
      });

      if (!res.ok) throw new Error("API error");

      const data = await res.json();

      if (!data || !data.title) throw new Error("No data");

      if (data.title === lastTitle) return;
      lastTitle = data.title;

      const artist = data.artist || DEFAULT_ARTIST;
      const cover = data.cover || DEFAULT_COVER;

      updateTrack(data.title, artist);
      setCover(cover);
      updateMediaSession(data.title, artist, cover);

      showToast(`${artist} - ${data.title}`);
      addToHistory(artist, data.title, cover);

    } catch (e) {
      console.warn("API falló, usando fallback");

      fallbackMetadata();
    }
  }

  // =========================
  // FALLBACK (iOS FIX)
  // =========================
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

      showToast(`${parsed.artist} - ${parsed.title}`);

    } catch {}
  }

  function startMetadata() {
    fetchMetadata();
    metadataTimer = setInterval(fetchMetadata, 6000);
  }

  function stopMetadata() {
    if (metadataTimer) clearInterval(metadataTimer);
  }

  // =========================
  // PLAY
  // =========================
  async function playStream() {
    try {
      setStatus("Conectando...");

      audio.crossOrigin = "anonymous";
      audio.src = STREAM_URL + "?t=" + Date.now();
      audio.load();

      await audio.play();

      updatePlayUI(true);
      setStatus("En vivo");

      startMetadata();

    } catch (e) {
      console.error(e);
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

  // =========================
  // EVENTOS AUDIO
  // =========================
  audio.addEventListener("playing", () => setStatus("En vivo"));
  audio.addEventListener("waiting", () => isPlaying && setStatus("Bufferizando..."));
  audio.addEventListener("error", () => setStatus("Error de señal"));

  // =========================
  // INIT
  // =========================
  updateTrack(DEFAULT_TRACK, DEFAULT_ARTIST);
  setCover(DEFAULT_COVER);
  updatePlayUI(false);

});

// =========================
// SERVICE WORKER
// =========================
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js")
    .then(() => console.log("SW activo"))
    .catch(err => console.log("SW error", err));
}
