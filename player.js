document.addEventListener("DOMContentLoaded", () => {
  const audio = document.getElementById("radioPlayer");
  const playerWrap = document.querySelector(".sonar-player-wrap");
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
  // CONFIG
  // =========================
  const STREAM_URL = "https://stream.zeno.fm/ezq3fcuf5ehvv";

  // AQUÍ VAS A PONER TU ENDPOINT REAL SI GissTV / Icecast LO DA
  // Ejemplo:
  // const METADATA_URL = "https://tuservidor.com/status-json.xsl";
  const METADATA_URL = "";

  const STORAGE_VOLUME = "sonarrock_volume";
  const STORAGE_MUTED = "sonarrock_muted";

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
  // METADATA
  // =========================
  async function fetchMetadata() {
    if (!METADATA_URL) return;

    try {
      const response = await fetch(`${METADATA_URL}?t=${Date.now()}`, {
        cache: "no-store"
      });

      if (!response.ok) return;

      const contentType = response.headers.get("content-type") || "";

      // CASO 1: JSON (Icecast status-json.xsl)
      if (contentType.includes("application/json") || contentType.includes("text/json")) {
        const data = await response.json();

        let title = "";

        if (data?.icestats?.source) {
          const source = Array.isArray(data.icestats.source)
            ? data.icestats.source[0]
            : data.icestats.source;

          title =
            source?.title ||
            source?.server_name ||
            source?.listenurl ||
            "";
        }

        if (title) updateTrack(title);
        return;
      }

      // CASO 2: HTML / texto (Shoutcast 7.html o status.xsl)
      const raw = await response.text();

      // Busca "Artist - Song"
      const cleaned = raw.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

      if (cleaned && cleaned.length > 3) {
        const match = cleaned.match(/([A-Za-z0-9À-ÿ&()[\].,'"\-\/ ]+\s-\s[A-Za-z0-9À-ÿ&()[\].,'"\-\/ ]+)/);

        if (match && match[1]) {
          updateTrack(match[1]);
        }
      }
    } catch (error) {
      console.warn("Metadata no disponible:", error);
    }
  }

  function startMetadataPolling() {
    stopMetadataPolling();

    if (!METADATA_URL) return;

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
});
