document.addEventListener("DOMContentLoaded", () => {
  const audio = document.getElementById("radioPlayer");
  const player = document.getElementById("sonarPlayer");
  const playBtn = document.getElementById("playBtn");
  const playIcon = document.getElementById("playIcon");
  const muteBtn = document.getElementById("muteBtn");
  const muteIcon = document.getElementById("muteIcon");
  const volumeControl = document.getElementById("volumeControl");
  const volumeEmoji = document.getElementById("volumeEmoji");
  const statusText = document.getElementById("statusText");
  const statusDot = document.getElementById("statusDot");
  const visualizer = document.getElementById("visualizer");

  const miniPlayer = document.getElementById("miniPlayer");
  const miniPlayBtn = document.getElementById("miniPlayBtn");
  const miniPlayIcon = document.getElementById("miniPlayIcon");
  const miniStatus = document.getElementById("miniStatus");

  if (!audio || !playBtn) return;

  const STREAM_URL = "https://stream.zeno.fm/ezq3fcuf5ehvv";
  const STORAGE_VOLUME = "sonarrock_volume";
  const STORAGE_MUTED = "sonarrock_muted";

  let isPlaying = false;
  let reconnectTimer = null;
  let reconnectAttempts = 0;
  let hasWarmedUp = false;
  let userPaused = false;
  const maxReconnectAttempts = 8;

  // =========================
  // CONFIG AUDIO
  // =========================
  audio.preload = "auto";
  audio.crossOrigin = "anonymous";
  audio.setAttribute("playsinline", "");
  audio.setAttribute("webkit-playsinline", "");

  // =========================
  // CARGAR PREFERENCIAS
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

    if (player) {
      player.classList.toggle("is-live", live);
      player.classList.toggle("playing", live);
    }

    if (miniPlayer) {
      miniPlayer.classList.toggle("live", live);
    }
  }

  function updatePlayUI(playing) {
    isPlaying = playing;

    if (playIcon) playIcon.textContent = playing ? "❚❚" : "▶";
    if (miniPlayIcon) miniPlayIcon.textContent = playing ? "❚❚" : "▶";

    if (visualizer) visualizer.classList.toggle("playing", playing);

    setStatus(playing ? "Transmitiendo en vivo" : "Listo para reproducir", playing);
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

  function getFreshStreamURL() {
    return `${STREAM_URL}?t=${Date.now()}`;
  }

  function warmUpStream() {
    if (hasWarmedUp) return;
    hasWarmedUp = true;

    try {
      audio.src = getFreshStreamURL();
      audio.load();
      setStatus("Señal lista", false);
    } catch (err) {
      console.warn("Warm-up falló:", err);
    }
  }

  function scheduleReconnect() {
    if (!isPlaying || userPaused) return;

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
        audio.src = getFreshStreamURL();
        audio.load();
        await audio.play();
      } catch (error) {
        console.error("Reconexión fallida:", error);
        scheduleReconnect();
      }
    }, 1800);
  }

  async function playStream() {
    try {
      userPaused = false;
      clearReconnect();
      reconnectAttempts = 0;

      setStatus("Conectando con la señal...", false);

      audio.src = getFreshStreamURL();
      audio.load();

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        await playPromise;
      }

      updatePlayUI(true);
    } catch (error) {
      console.error("Error al reproducir stream:", error);
      updatePlayUI(false);
      setStatus("Toca reproducir nuevamente", false);
    }
  }

  function pauseStream() {
    userPaused = true;
    clearReconnect();
    audio.pause();
    updatePlayUI(false);
  }

  // =========================
  // BOTONES
  // =========================
  playBtn.addEventListener("click", async () => {
    if (audio.paused) {
      await playStream();
    } else {
      pauseStream();
    }
  });

  miniPlayBtn?.addEventListener("click", async () => {
    if (audio.paused) {
      await playStream();
    } else {
      pauseStream();
    }
  });

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
  });

  audio.addEventListener("pause", () => {
    if (!reconnectTimer && userPaused) {
      updatePlayUI(false);
    }
  });

  audio.addEventListener("waiting", () => {
    if (isPlaying && !userPaused) {
      setStatus("Bufferizando señal...", false);
    }
  });

  audio.addEventListener("stalled", () => {
    if (isPlaying && !userPaused) {
      setStatus("Señal detenida, reconectando...", false);
      scheduleReconnect();
    }
  });

  audio.addEventListener("suspend", () => {
    if (isPlaying && !userPaused) {
      setStatus("Señal suspendida, reconectando...", false);
      scheduleReconnect();
    }
  });

  audio.addEventListener("error", () => {
    console.error("Error en stream");
    if (isPlaying && !userPaused) {
      setStatus("Error en la señal, reconectando...", false);
      scheduleReconnect();
    } else {
      updatePlayUI(false);
      setStatus("Error al conectar con la señal", false);
    }
  });

  audio.addEventListener("loadstart", () => {
    if (!userPaused) setStatus("Cargando stream...", false);
  });

  audio.addEventListener("canplay", () => {
    if (!isPlaying && !userPaused) {
      setStatus("Señal lista", false);
    }
  });

  audio.addEventListener("volumechange", updateMuteUI);

  // =========================
  // VISIBILIDAD / iPHONE
  // =========================
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && isPlaying && audio.paused && !userPaused) {
      playStream();
    }
  });

  // =========================
  // MINI PLAYER SHOW/HIDE
  // =========================
  function toggleMiniPlayer() {
    if (!miniPlayer) return;

    const isMobile = window.innerWidth <= 768;
    const scrollY = window.scrollY || window.pageYOffset;

    if (isMobile && scrollY > 280) {
      miniPlayer.classList.add("show");
    } else {
      miniPlayer.classList.remove("show");
    }
  }

  window.addEventListener("scroll", toggleMiniPlayer, { passive: true });
  window.addEventListener("resize", toggleMiniPlayer);

  // =========================
  // WARM-UP TEMPRANO
  // =========================
  warmUpStream();

  window.addEventListener("touchstart", warmUpStream, { once: true, passive: true });
  window.addEventListener("click", warmUpStream, { once: true, passive: true });

  // =========================
  // INIT
  // =========================
  updateMuteUI();
  updatePlayUI(false);
  toggleMiniPlayer();
});
