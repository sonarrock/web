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

  if (!audio || !playBtn) return;

  // =========================
  // CONFIG GISS
  // =========================
  const STREAM_URL = "https://giss.tv:667/sonarrock.mp3";
  const METADATA_URL = "https://giss.tv:667/status-json.xsl";
  const STATION_MOUNT = "sonarrock.mp3";

  const STORAGE_VOLUME = "sonarrock_volume";
  const STORAGE_MUTED = "sonarrock_muted";
  const STORAGE_LAST_TRACK = "sonarrock_last_track";

  const DEFAULT_TRACK_TEXT = "Transmitiendo rock sin concesiones";

  let isPlaying = false;
  let reconnectTimer = null;
  let reconnectAttempts = 0;
  let metadataTimer = null;
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
  const savedTrack = localStorage.getItem(STORAGE_LAST_TRACK);

  audio.volume = savedVolume !== null ? parseFloat(savedVolume) : 1;
  audio.muted = savedMuted === "true";

  if (volumeControl) {
    volumeControl.value = audio.muted ? 0 : audio.volume;
  }

  // =========================
  // HELPERS UI
  // =========================
  function sanitizeText(text) {
    if (!text || typeof text !== "string") return "";
    return text
      .replace(/\s+/g, " ")
      .replace(/_/g, " ")
      .trim();
  }

  function setStatus(text, live = false) {
    if (statusText) statusText.textContent = text;
    if (miniStatus) miniStatus.textContent = text;
    if (statusDot) statusDot.classList.toggle("live", live);
    if (miniLiveDot) miniLiveDot.classList.toggle("live", live);
    if (player) player.classList.toggle("is-live", live);
  }

  function updateTrack(text) {
    const safeText = sanitizeText(text) || DEFAULT_TRACK_TEXT;
    if (trackInfo) trackInfo.textContent = safeText;
    localStorage.setItem(STORAGE_LAST_TRACK, safeText);
  }

  function updatePlayUI(playing) {
    isPlaying = playing;

    if (playIcon) playIcon.textContent = playing ? "❚❚" : "▶";
    if (miniPlayIcon) miniPlayIcon.textContent = playing ? "❚❚" : "▶";

    if (player) player.classList.toggle("playing", playing);

    setStatus(playing ? "Transmitiendo en vivo" : "Listo para reproducir", playing);

    if (!playing) {
      stopMetadataPolling();
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

  function getStationFromJson(data) {
    const sources = data?.icestats?.source;
    if (!sources) return null;

    const sourceList = Array.isArray(sources) ? sources : [sources];

    return sourceList.find((src) => {
      const listenurl = (src.listenurl || "").toLowerCase();
      const serverName = (src.server_name || "").toLowerCase();
      const serverDescription = (src.server_description || "").toLowerCase();
      const serverUrl = (src.server_url || "").toLowerCase();

      return (
        listenurl.includes(STATION_MOUNT) ||
        serverName.includes("sonarrock") ||
        serverDescription.includes("sonar rock") ||
        serverUrl.includes(STATION_MOUNT)
      );
    }) || null;
  }

  function buildTrackText(station) {
    if (!station) return DEFAULT_TRACK_TEXT;

    const title = sanitizeText(station.title || "");
    const artist = sanitizeText(station.artist || "");
    const serverName = sanitizeText(station.server_name || "");

    if (title && title.length > 2) return title;
    if (artist && artist.length > 2) return artist;
    if (serverName && serverName.length > 2) return serverName;

    return DEFAULT_TRACK_TEXT;
  }

  // =========================
  // METADATA
  // =========================
  async function fetchMetadata() {
    if (!METADATA_URL) return;

    try {
      const response = await fetch(`${METADATA_URL}?t=${Date.now()}`, {
        cache: "no-store"
      });

      if (!response.ok) return;

      const data = await response.json();
      const station = getStationFromJson(data);

      if (!station) {
        updateTrack(DEFAULT_TRACK_TEXT);
        return;
      }

      const trackText = buildTrackText(station);
      updateTrack(trackText);
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
  updateTrack(savedTrack || DEFAULT_TRACK_TEXT);
});
