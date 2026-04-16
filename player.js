document.addEventListener("DOMContentLoaded", () => {

  const audio = document.getElementById("radioPlayer");
  const playBtn = document.getElementById("playBtn");
  const playIcon = document.getElementById("playIcon");

  const trackInfo = document.getElementById("trackInfo");
  const trackArtist = document.getElementById("trackArtist");

  const statusText = document.getElementById("statusText");

  if (!audio || !playBtn) return;

  // =========================
  // DETECTAR MÓVIL
  // =========================
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  // =========================
  // CONFIG
  // =========================
  const STREAM_URL = "https://giss.tv:667/sonarrock.mp3";
  const METADATA_URL = "https://giss.tv:667/status-json.xsl";
  const FALLBACK_URL = "https://giss.tv/player/playing.php?mp=sonarrock.mp3";

  const DEFAULT_TRACK = "Transmitiendo rock sin concesiones";
  const DEFAULT_ARTIST = "SONAR ROCK";

  let isPlaying = false;
  let metadataTimer = null;
  let lastTitle = "";

  // =========================
  // AUDIO SETUP
  // =========================
  audio.preload = "none";
  audio.playsInline = true;
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

  // =========================
  // PARSE TITLE
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
  // METADATA
  // =========================
  async function fetchMetadata() {
    try {
      const res = await fetch(`${METADATA_URL}?t=${Date.now()}`, { cache: "no-store" });
      const data = await res.json();

      let source = data.icestats.source;

      if (Array.isArray(source)) {
        source = source.find(s => (s.listenurl || "").includes("sonarrock.mp3"));
      }

      let title = source?.title || "";

      // fallback si viene vacío
      if (!title || title === "-") {
        const fb = await fetch(FALLBACK_URL + "&t=" + Date.now());
        title = await fb.text();
      }

      if (!title) return;

      if (title !== lastTitle) {
        lastTitle = title;

        const parsed = parseTitle(title);

        updateTrack(parsed.title, parsed.artist);
      }

    } catch (e) {
      console.warn("Metadata error:", e);
    }
  }

  function startMetadata() {
    fetchMetadata();
    metadataTimer = setInterval(fetchMetadata, 10000);
  }

  function stopMetadata() {
    if (metadataTimer) {
      clearInterval(metadataTimer);
      metadataTimer = null;
    }
  }

  // =========================
  // PLAY (FIX iOS)
  // =========================
  async function playStream() {
    try {
      setStatus("Conectando...");

      audio.crossOrigin = "anonymous";
      audio.src = `${STREAM_URL}?t=${Date.now()}`;
      audio.load();

      await audio.play(); // 🔥 primero

      updatePlayUI(true);
      setStatus("En vivo");

      startMetadata();

    } catch (e) {
      console.error(e);
      setStatus("Toca reproducir nuevamente");
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
  audio.addEventListener("waiting", () => {
    if (isPlaying) setStatus("Bufferizando...");
  });

  audio.addEventListener("playing", () => {
    setStatus("En vivo");
  });

  audio.addEventListener("error", () => {
    setStatus("Error de señal");
  });

  // =========================
  // INIT
  // =========================
  updateTrack(DEFAULT_TRACK, DEFAULT_ARTIST);
  updatePlayUI(false);

});
