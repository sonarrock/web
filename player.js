document.addEventListener("DOMContentLoaded", () => {
  const audio = document.getElementById("radioPlayer");
  const player = document.getElementById("sonarPlayer");

  const playBtn = document.getElementById("playBtn");
  const playIcon = document.getElementById("playIcon");

  const miniPlayBtn = document.getElementById("miniPlayBtn");
  const miniPlayIcon = document.getElementById("miniPlayIcon");

  const muteBtn = document.getElementById("muteBtn");
  const muteIcon = document.getElementById("muteIcon");

  const volumeControl = document.getElementById("volumeControl");
  const volumeEmoji = document.getElementById("volumeEmoji");

  const statusText = document.getElementById("statusText");
  const statusDot = document.getElementById("statusDot");
  const miniStatus = document.getElementById("miniStatus");
  const miniLiveDot = document.getElementById("miniLiveDot");

  const trackInfo = document.getElementById("trackInfo");
  const miniPlayer = document.getElementById("miniPlayer");
  const stationCover = document.getElementById("stationCover");

  if (!audio || !playBtn) return;

  // =========================
  // CONFIG
  // =========================
  const STREAM_URL = "https://giss.tv:667/sonarrock.mp3";
  const METADATA_URL = "https://giss.tv:667/status-json.xsl";

  const STORAGE_VOLUME = "sonarrock_volume";
  const STORAGE_MUTED = "sonarrock_muted";

  const DEFAULT_TRACK_TEXT = "Transmitiendo rock sin concesiones";
  const DEFAULT_COVER = "attached_assets/logo_1749601460841.jpeg";
  const TARGET_MOUNT = "/sonarrock.mp3";

  let isPlaying = false;
  let reconnectTimer = null;
  let reconnectAttempts = 0;
  let metadataTimer = null;
  let lastTrack = "";
  let lastCoverQuery = "";

  const maxReconnectAttempts = 8;

  audio.src = STREAM_URL;
  audio.preload = "none";
  audio.setAttribute("playsinline", "");
  audio.setAttribute("webkit-playsinline", "");
  audio.crossOrigin = "anonymous";

  // =========================
  // CARGAR CONFIG GUARDADA
  // =========================
  const savedVolume = localStorage.getItem(STORAGE_VOLUME);
  const savedMuted = localStorage.getItem(STORAGE_MUTED);

  audio.volume = savedVolume !== null ? parseFloat(savedVolume) : 1;
  audio.muted = savedMuted === "true";

  if (volumeControl) {
    volumeControl.value = audio.muted ? 0 : audio.volume;
  }

  // =========================
  // HELPERS UI
  // =========================
  function setStatus(text, live = false) {
    if (statusText) statusText.textContent = text;
    if (miniStatus) miniStatus.textContent = text;
    if (statusDot) statusDot.classList.toggle("live", live);
    if (miniLiveDot) miniLiveDot.classList.toggle("live", live);
    if (player) player.classList.toggle("is-live", live);
  }

  function updateTrack(text) {
    const safeText = text && text.trim() ? text.trim() : DEFAULT_TRACK_TEXT;
    if (trackInfo) trackInfo.textContent = safeText;
  }

  function updatePlayUI(playing) {
    isPlaying = playing;

    if (playIcon) playIcon.textContent = playing ? "❚❚" : "▶";
    if (miniPlayIcon) miniPlayIcon.textContent = playing ? "❚❚" : "▶";

    if (player) player.classList.toggle("playing", playing);

    setStatus(playing ? "Transmitiendo en vivo" : "Listo para reproducir", playing);

    if (!playing) {
      stopMetadataPolling();
      updateTrack(DEFAULT_TRACK_TEXT);
      resetCover();
    }
  }

  function updateMuteUI() {
    const muted = audio.muted || audio.volume === 0;

    if (muteIcon) muteIcon.textContent = muted ? "🔇" : "🔊";
    if (volumeEmoji) volumeEmoji.textContent = muted ? "🔇" : "🔊";

    if (volumeControl) {
      volumeControl.value = audio.muted ? 0 : audio.volume;
    }
  }

  function saveAudioPrefs() {
    localStorage.setItem(STORAGE_VOLUME, audio.volume.toString());
    localStorage.setItem(STORAGE_MUTED, audio.muted.toString());
  }

  function clearReconnect() {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  }

  // =========================
  // COVER ART
  // =========================
  function resetCover() {
    if (!stationCover) return;
    stationCover.src = DEFAULT_COVER;
    stationCover.classList.add("is-fallback");
    lastCoverQuery = "";
  }

  function setCover(url) {
    if (!stationCover || !url) return;
    stationCover.src = url;
    stationCover.classList.remove("is-fallback");
  }

  function normalizeTrackTitle(title) {
    if (!title) return "";

    return title
      .replace(/^NOW:\s*/i, "")
      .replace(/\s+/g, " ")
      .replace(/_/g, " ")
      .trim();
  }

  function splitArtistTitle(track) {
    if (!track || !track.includes(" - ")) {
      return { artist: "", title: track || "" };
    }

    const parts = track.split(" - ");
    const artist = parts.shift().trim();
    const title = parts.join(" - ").trim();

    return { artist, title };
  }

  async function fetchCoverArt(trackTitle) {
    if (!trackTitle) {
      resetCover();
      return;
    }

    const normalized = normalizeTrackTitle(trackTitle);

    if (!normalized || normalized === lastCoverQuery) return;
    lastCoverQuery = normalized;

    const { artist, title } = splitArtistTitle(normalized);

    const query = encodeURIComponent(`${artist} ${title}`.trim());

    try {
      const response = await fetch(`https://itunes.apple.com/search?term=${query}&entity=song&limit=1`);
      if (!response.ok) throw new Error("No se pudo consultar portada");

      const data = await response.json();

      if (data.results && data.results.length > 0) {
        const artwork =
          data.results[0].artworkUrl100
            ?.replace("100x100bb", "600x600bb")
            ?.replace("100x100", "600x600");

        if (artwork) {
          setCover(artwork);
          return;
        }
      }

      resetCover();
    } catch (error) {
      console.warn("No se encontró portada:", error);
      resetCover();
    }
  }

  // =========================
  // METADATA
  // =========================
  function findCorrectSource(sourceData) {
    if (!sourceData) return null;

    const sources = Array.isArray(sourceData) ? sourceData : [sourceData];

    return sources.find((s) => {
      const listen = (s.listenurl || "").toLowerCase();
      const serverUrl = (s.server_url || "").toLowerCase();
      const mountGuess = (s.server_name || "").toLowerCase();

      return (
        listen.includes("sonarrock.mp3") ||
        serverUrl.includes("sonarrock.mp3") ||
        mountGuess.includes("sonarrock")
      );
    }) || null;
  }

  async function fetchMetadata() {
    try {
      const response = await fetch(`${METADATA_URL}?t=${Date.now()}`, {
        cache: "no-store"
      });

      if (!response.ok) return;

      const data = await response.json();
      const source = findCorrectSource(data?.icestats?.source);

      if (!source) return;

      const title =
        source.title ||
        source.artist ||
        source.server_name ||
        DEFAULT_TRACK_TEXT;

      const cleanTitle = normalizeTrackTitle(title);

      if (cleanTitle && cleanTitle !== lastTrack) {
        lastTrack = cleanTitle;
        updateTrack(cleanTitle);
        fetchCoverArt(cleanTitle);
      }
    } catch (error) {
      console.warn("Metadata no disponible:", error);
    }
  }

  function startMetadataPolling() {
    stopMetadataPolling();
    fetchMetadata();
    metadataTimer = setInterval(fetchMetadata, 15000);
  }

  function stopMetadataPolling() {
    if (metadataTimer) {
      clearInterval(metadataTimer);
      metadataTimer = null;
    }
  }

  // =========================
  // RECONEXIÓN
  // =========================
  function scheduleReconnect() {
    if (!isPlaying) return;

    if (reconnectAttempts >= maxReconnectAttempts) {
      setStatus("No se pudo reconectar la señal", false);
      updatePlayUI(false);
      return;
    }

    clearReconnect();
    reconnectAttempts++;

    setStatus(`Reconectando señal... (${reconnectAttempts})`, false);

    reconnectTimer = setTimeout(async () => {
      try {
        audio.src = STREAM_URL + "?t=" + Date.now();
        await audio.play();
      } catch (error) {
        console.error("Reconexión fallida:", error);
        scheduleReconnect();
      }
    }, 2500);
  }

  // =========================
  // PLAY / PAUSE
  // =========================
  async function playStream() {
    try {
      clearReconnect();
      reconnectAttempts = 0;
      setStatus("Conectando con la señal...", false);

      audio.src = STREAM_URL + "?t=" + Date.now();
      await audio.play();

      updatePlayUI(true);
      startMetadataPolling();
    } catch (error) {
      console.error("Error al reproducir stream:", error);
      updatePlayUI(false);
      setStatus("Toca reproducir nuevamente", false);
    }
  }

  function pauseStream() {
    clearReconnect();
    stopMetadataPolling();
    audio.pause();
    updatePlayUI(false);
  }

  function togglePlay() {
    if (audio.paused) {
      playStream();
    } else {
      pauseStream();
    }
  }

  // =========================
  // EVENTOS BOTONES
  // =========================
  playBtn.addEventListener("click", togglePlay);
  miniPlayBtn?.addEventListener("click", togglePlay);

  muteBtn?.addEventListener("click", () => {
    audio.muted = !audio.muted;

    if (!audio.muted && audio.volume === 0) {
      audio.volume = 1;
      if (volumeControl) volumeControl.value = 1;
    }

    updateMuteUI();
    saveAudioPrefs();
  });

  volumeControl?.addEventListener("input", (e) => {
    const value = parseFloat(e.target.value);

    audio.volume = value;
    audio.muted = value === 0;

    updateMuteUI();
    saveAudioPrefs();
  });

  // =========================
  // EVENTOS AUDIO
  // =========================
  audio.addEventListener("playing", () => {
    clearReconnect();
    reconnectAttempts = 0;
    updatePlayUI(true);
    startMetadataPolling();
  });

  audio.addEventListener("pause", () => {
    if (!reconnectTimer) {
      updatePlayUI(false);
    }
  });

  audio.addEventListener("waiting", () => {
    if (isPlaying) setStatus("Bufferizando señal...", false);
  });

  audio.addEventListener("stalled", () => {
    if (isPlaying) {
      setStatus("Señal detenida, reconectando...", false);
      scheduleReconnect();
    }
  });

  audio.addEventListener("suspend", () => {
    if (isPlaying) {
      setStatus("Señal suspendida, reconectando...", false);
      scheduleReconnect();
    }
  });

  audio.addEventListener("error", () => {
    console.error("Error en stream");
    if (isPlaying) {
      setStatus("Error en la señal, reconectando...", false);
      scheduleReconnect();
    } else {
      updatePlayUI(false);
      setStatus("Error al conectar con la señal", false);
    }
  });

  audio.addEventListener("loadstart", () => {
    if (isPlaying) setStatus("Cargando stream...", false);
  });

  audio.addEventListener("volumechange", updateMuteUI);

  // =========================
  // VISIBILIDAD / iPHONE
  // =========================
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && isPlaying && audio.paused) {
      playStream();
    }
  });

  // =========================
  // MINI PLAYER MÓVIL
  // =========================
  function handleMiniPlayer() {
    if (!miniPlayer) return;

    if (window.innerWidth <= 768) {
      miniPlayer.classList.add("show");
    } else {
      miniPlayer.classList.remove("show");
    }
  }

  window.addEventListener("resize", handleMiniPlayer);
  handleMiniPlayer();

  // =========================
  // INIT
  // =========================
  updateMuteUI();
  updatePlayUI(false);
  updateTrack(DEFAULT_TRACK_TEXT);
  resetCover();
});
