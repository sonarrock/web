<script>
document.addEventListener("DOMContentLoaded", () => {
  // =========================
  // CONFIG
  // =========================
  const STREAM_URL = "https://stream.zeno.fm/TU-STREAM-AQUI"; // <-- CAMBIA ESTO
  const audio = document.getElementById("radio-audio");
  const playPauseBtn = document.getElementById("playPauseBtn");
  const stopBtn = document.getElementById("stop-btn");
  const muteBtn = document.getElementById("mute-btn");
  const volume = document.getElementById("volume");
  const timer = document.getElementById("timer");
  const statusText = document.getElementById("status-text");
  const playIcon = playPauseBtn.querySelector("i");
  const muteIcon = muteBtn.querySelector("i");

  let isPlaying = false;
  let isMuted = false;
  let startTime = null;
  let timerInterval = null;
  let userUnlocked = false;
  let isLoading = false;
  let retryCount = 0;
  const MAX_RETRIES = 2;

  // =========================
  // INIT AUDIO
  // =========================
  audio.preload = "auto";
  audio.src = STREAM_URL;
  audio.volume = 1;
  audio.muted = false;

  // iOS / Android warm-up
  // Carga el stream desde el arranque para que no llegue "frío" al primer click
  try {
    audio.load();
  } catch (e) {
    console.warn("Audio load init error:", e);
  }

  // =========================
  // UI HELPERS
  // =========================
  function setStatus(text, live = false) {
    statusText.textContent = text;
    const indicator = document.getElementById("live-indicator");
    if (live) {
      indicator.classList.add("online");
      indicator.classList.remove("offline");
    } else {
      indicator.classList.add("offline");
      indicator.classList.remove("online");
    }
  }

  function updatePlayIcon(playing) {
    playIcon.className = playing ? "fas fa-pause" : "fas fa-play";
  }

  function updateMuteIcon() {
    muteIcon.className = audio.muted || audio.volume === 0
      ? "fas fa-volume-mute"
      : "fas fa-volume-up";
  }

  function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    startTime = Date.now();

    timerInterval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const mins = String(Math.floor(elapsed / 60)).padStart(2, "0");
      const secs = String(elapsed % 60).padStart(2, "0");
      timer.textContent = `${mins}:${secs}`;
    }, 1000);
  }

  function stopTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
    startTime = null;
    timer.textContent = "00:00";
  }

  function safeReloadStream() {
    try {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();

      setTimeout(() => {
        audio.src = STREAM_URL + (STREAM_URL.includes("?") ? "&" : "?") + "t=" + Date.now();
        audio.load();
      }, 150);
    } catch (e) {
      console.warn("safeReloadStream error:", e);
    }
  }

  // =========================
  // MOBILE / IOS UNLOCK
  // =========================
  async function unlockAudio() {
    if (userUnlocked) return true;

    try {
      // Intento de "despertar" el elemento en un gesto de usuario
      audio.muted = true;
      await audio.play();
      audio.pause();
      audio.currentTime = 0;
      audio.muted = isMuted;
      userUnlocked = true;
      console.log("Audio unlocked");
      return true;
    } catch (err) {
      console.warn("Unlock failed:", err);
      audio.muted = isMuted;
      return false;
    }
  }

  // =========================
  // PLAY LOGIC
  // =========================
  async function playStream(forceReload = false) {
    if (isLoading) return;

    isLoading = true;
    setStatus("CONECTANDO...", false);

    try {
      // 1) Desbloquear audio con gesto real
      await unlockAudio();

      // 2) Si el stream está "frío" o atorado, recargarlo
      if (forceReload || audio.networkState === HTMLMediaElement.NETWORK_NO_SOURCE) {
        safeReloadStream();
        await new Promise(resolve => setTimeout(resolve, 400));
      }

      // 3) Asegurar que el src exista
      if (!audio.src || audio.src.trim() === "") {
        audio.src = STREAM_URL;
        audio.load();
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      // 4) Intentar reproducir
      const playPromise = audio.play();

      if (playPromise !== undefined) {
        await playPromise;
      }

      isPlaying = true;
      retryCount = 0;
      updatePlayIcon(true);
      startTimer();
      setStatus("LIVE", true);

    } catch (err) {
      console.warn("Play error:", err);

      // Reintento inteligente
      if (retryCount < MAX_RETRIES) {
        retryCount++;
        console.log(`Retry play ${retryCount}/${MAX_RETRIES}`);
        safeReloadStream();

        setTimeout(async () => {
          isLoading = false;
          await playStream(false);
        }, 800);

        return;
      }

      isPlaying = false;
      updatePlayIcon(false);
      stopTimer();
      setStatus("OFFLINE", false);

    } finally {
      isLoading = false;
    }
  }

  function pauseStream() {
    audio.pause();
    isPlaying = false;
    updatePlayIcon(false);
    stopTimer();
    setStatus("PAUSADO", false);
  }

  function stopStream() {
    isPlaying = false;
    audio.pause();

    // No hacemos destroy completo agresivo cada vez
    // porque eso a veces rompe el primer play en iOS/Android
    try {
      audio.currentTime = 0;
    } catch (e) {}

    updatePlayIcon(false);
    stopTimer();
    setStatus("OFFLINE", false);
  }

  // =========================
  // BUTTON EVENTS
  // =========================
  playPauseBtn.addEventListener("click", async () => {
    if (isPlaying) {
      pauseStream();
    } else {
      await playStream(false);
    }
  });

  stopBtn.addEventListener("click", () => {
    stopStream();
  });

  muteBtn.addEventListener("click", () => {
    audio.muted = !audio.muted;
    isMuted = audio.muted;
    updateMuteIcon();
  });

  volume.addEventListener("input", () => {
    audio.volume = parseFloat(volume.value);

    if (audio.volume > 0 && audio.muted) {
      audio.muted = false;
      isMuted = false;
    }

    if (audio.volume === 0) {
      audio.muted = true;
      isMuted = true;
    }

    updateMuteIcon();
  });

  // =========================
  // STREAM EVENTS
  // =========================
  audio.addEventListener("playing", () => {
    isPlaying = true;
    updatePlayIcon(true);
    setStatus("LIVE", true);
    if (!timerInterval) startTimer();
  });

  audio.addEventListener("pause", () => {
    if (isPlaying) {
      isPlaying = false;
      updatePlayIcon(false);
      stopTimer();
      setStatus("PAUSADO", false);
    }
  });

  audio.addEventListener("waiting", () => {
    if (isPlaying) setStatus("BUFFERING...", false);
  });

  audio.addEventListener("stalled", () => {
    if (isPlaying) setStatus("RECONectando...", false);
  });

  audio.addEventListener("canplay", () => {
    if (!isPlaying) {
      setStatus("LISTO", false);
    }
  });

  audio.addEventListener("error", (e) => {
    console.warn("Audio error:", e);
    isPlaying = false;
    updatePlayIcon(false);
    stopTimer();
    setStatus("ERROR", false);
  });

  audio.addEventListener("ended", () => {
    // Algunos streams "ended" falsamente en móviles
    if (isPlaying) {
      setTimeout(() => {
        playStream(true);
      }, 500);
    }
  });

  // =========================
  // PAGE VISIBILITY
  // =========================
  document.addEventListener("visibilitychange", () => {
    // Si el usuario vuelve a la pestaña y el stream quedó zombie, lo revivimos
    if (!document.hidden && isPlaying && audio.paused) {
      setTimeout(() => {
        playStream(true);
      }, 300);
    }
  });

  // =========================
  // PRIMER TOQUE GLOBAL = PRE-UNLOCK
  // =========================
  const primeAudio = async () => {
    if (!userUnlocked) {
      await unlockAudio();
    }
    window.removeEventListener("touchstart", primeAudio);
    window.removeEventListener("click", primeAudio);
  };

  window.addEventListener("touchstart", primeAudio, { passive: true, once: true });
  window.addEventListener("click", primeAudio, { passive: true, once: true });

  // =========================
  // INITIAL UI
  // =========================
  updatePlayIcon(false);
  updateMuteIcon();
  setStatus("LISTO", false);
});
</script>
