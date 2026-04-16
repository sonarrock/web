document.addEventListener("DOMContentLoaded", () => {

  const audio = document.getElementById("radioPlayer");
  const playBtn = document.getElementById("playBtn");
  const playIcon = document.getElementById("playIcon");

  const trackInfo = document.getElementById("trackInfo");
  const trackArtist = document.getElementById("trackArtist");
  const stationCover = document.getElementById("stationCover");

  const statusText = document.getElementById("statusText");

  if (!audio || !playBtn) return;

  const STREAM_URL = "https://giss.tv:667/sonarrock.mp3";
  const METADATA_URL = "https://giss.tv:667/status-json.xsl";
  const FALLBACK_URL = "https://giss.tv/player/playing.php?mp=sonarrock.mp3";

  const DEFAULT_TRACK = "Transmitiendo rock sin concesiones";
  const DEFAULT_ARTIST = "SONAR ROCK";
  const DEFAULT_COVER = "attached_assets/logo_1749601460841.jpeg";

  let isPlaying = false;
  let metadataTimer = null;
  let lastTitle = "";

  audio.preload = "none";
  audio.playsInline = true;

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
  // TOAST (cambio de canción)
  // =========================
  function showToast(text) {
    let toast = document.getElementById("songToast");
    if (!toast) return;

    toast.textContent = text;
    toast.classList.add("show");

    setTimeout(() => toast.classList.remove("show"), 3000);
  }

  // =========================
  // PORTADAS (iTunes)
  // =========================
  async function fetchCover(artist, title) {
    try {
      const q = encodeURIComponent(`${artist} ${title}`);
      const res = await fetch(`https://itunes.apple.com/search?term=${q}&limit=1`);
      const data = await res.json();

      if (data.results && data.results[0]) {
        return data.results[0].artworkUrl100.replace("100x100bb", "600x600bb");
      }
    } catch {}
    return DEFAULT_COVER;
  }

  // =========================
  // MEDIA SESSION (LOCKSCREEN)
  // =========================
  function updateMediaSession(title, artist, cover) {
    if (!("mediaSession" in navigator)) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: title,
      artist: artist,
      album: "Sonar Rock",
      artwork: [
        { src: cover, sizes: "512x512", type: "image/png" }
      ]
    });

    navigator.mediaSession.setActionHandler("play", playStream);
    navigator.mediaSession.setActionHandler("pause", pauseStream);
  }

  // =========================
  // PARSE
  // =========================
  function parseTitle(text = "") {
    text = decodeURIComponent(text || "").trim();

    if (!text || text === "-") {
      return { artist: DEFAULT_ARTIST, title: DEFAULT_TRACK };
    }

    if (text.includes(" - ")) {
      const parts = text.split(" - ");
      return {
        artist: parts[0].trim(),
        title: parts.slice(1).join(" - ").trim()
      };
    }

    return {
      artist: DEFAULT_ARTIST,
      title: text
    };
  }

  // =========================
  // METADATA PRO
  // =========================
  async function fetchMetadata() {
  try {
    let title = "";

    // 🔥 1. PRIORIDAD: endpoint simple (funciona en móvil)
    try {
      const fb = await fetch(FALLBACK_URL + "&t=" + Date.now(), {
        cache: "no-store"
      });
      title = (await fb.text()).trim();
    } catch {}

    // 🔥 2. SI FALLA, intentar JSON (PC principalmente)
    if (!title || title === "-") {
      try {
        const res = await fetch(`${METADATA_URL}?t=${Date.now()}`);
        const data = await res.json();

        let source = data.icestats.source;

        if (Array.isArray(source)) {
          source = source.find(s =>
            (s.listenurl || "").includes("sonarrock.mp3")
          );
        }

        title = source?.title || "";
      } catch {}
    }

    if (!title || title === "-" || title === lastTitle) return;

    lastTitle = title;

    const parsed = parseTitle(title);

    updateTrack(parsed.title, parsed.artist);

    const cover = await fetchCover(parsed.artist, parsed.title);
    setCover(cover);

    updateMediaSession(parsed.title, parsed.artist, cover);

    showToast(`${parsed.artist} - ${parsed.title}`);

  } catch (e) {
    console.warn("Metadata error:", e);
  }
}

  
  // =========================
  // PLAY
  // =========================
  async function playStream() {
    try {
      setStatus("Conectando...");

      audio.crossOrigin = "anonymous";
      audio.src = `${STREAM_URL}?t=${Date.now()}`;
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
  // EVENTOS
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
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js")
    .then(() => console.log("SW activo"))
    .catch(err => console.log("SW error", err));
}
