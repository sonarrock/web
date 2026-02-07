document.addEventListener("DOMContentLoaded", () => {
  const audio = document.getElementById("radio-audio");
  const playBtn = document.getElementById("playPauseBtn");
  const stopBtn = document.getElementById("stop-btn");
  const muteBtn = document.getElementById("mute-btn");
  const volumeSlider = document.getElementById("volume");
  const statusText = document.getElementById("status-text");
  const timerEl = document.getElementById("timer");
  const container = document.querySelector(".player-container");

  const STREAM_URL = "https://stream.zeno.fm/ezq3fcuf5ehvv";

  let timerInterval;
  let reconnectTimer;
  let seconds = 0;
  let isPlaying = false;
  let streamInitialized = false;

  /* =========================
     CONFIGURACIÓN BÁSICA
  ========================== */
  audio.preload = "metadata"; // 🔥 mejora primer click
  audio.crossOrigin = "anonymous";
  audio.volume = volumeSlider.value;

  /* =========================
     UI / ESTADO
  ========================== */
  function updateStatus(status) {
    statusText.textContent = status.toUpperCase();

    if (status === "REPRODUCIENDO") {
      statusText.style.color = "#00ff88";
    } else if (status === "OFFLINE") {
      statusText.style.color = "#ff4d4d";
    } else {
      statusText.style.color = "#ffffff";
    }
  }

  updateStatus("OFFLINE");

  /* =========================
     TIMER
  ========================== */
  function startTimer() {
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      seconds++;
      const m = String(Math.floor(seconds / 60)).padStart(2, "0");
      const s = String(seconds % 60).padStart(2, "0");
      timerEl.textContent = `${m}:${s}`;
    }, 1000);
  }

  function stopTimer() {
    clearInterval(timerInterval);
    seconds = 0;
    timerEl.textContent = "00:00";
  }

  /* =========================
     RECONEXIÓN AUTOMÁTICA
  ========================== */
  function tryReconnect() {
    clearTimeout(reconnectTimer);

    updateStatus("OFFLINE");
    isPlaying = false;
    container.classList.remove("playing");
    playBtn.classList.remove("loading");
    playBtn.innerHTML = '<i class="fas fa-play"></i>';

    reconnectTimer = setTimeout(() => {
      if (streamInitialized) {
        audio.load();
        audio.play().catch(() => {});
      }
    }, 2000);
  }

  /* =========================
     EVENTOS DE AUDIO
  ========================== */
  audio.addEventListener("waiting", () => {
    updateStatus("CARGANDO");
  });

  audio.addEventListener("playing", () => {
    updateStatus("REPRODUCIENDO");
    playBtn.classList.remove("loading");
    playBtn.innerHTML = '<i class="fas fa-pause"></i>';
    container.classList.add("playing");
    isPlaying = true;
    startTimer();
  });

  audio.addEventListener("pause", () => {
    if (!audio.ended) {
      updateStatus("OFFLINE");
    }
  });

  audio.addEventListener("error", tryReconnect);
  audio.addEventListener("stalled", tryReconnect);
  audio.addEventListener("ended", tryReconnect);

  /* =========================
     CONTROLES
  ========================== */

  // ▶️ Play / Pause
  playBtn.addEventListener("click", () => {
    if (!isPlaying) {

      // 🔥 inicializar stream SOLO la primera vez
      if (!streamInitialized) {
        audio.src = STREAM_URL + "?t=" + Date.now();
        audio.load();
        streamInitialized = true;
      }

      // Pausar otro audio si existe
      const discoAudio = document.getElementById("disco-audio");
      if (discoAudio && !discoAudio.paused) {
        discoAudio.pause();
      }

      updateStatus("CARGANDO");
      playBtn.classList.add("loading");
      playBtn.innerHTML = '<i class="fas fa-spinner"></i>';

      audio.play().catch(err => {
        console.warn("Play bloqueado:", err);
        playBtn.classList.remove("loading");
        playBtn.innerHTML = '<i class="fas fa-play"></i>';
      });

    } else {
      audio.pause();
      isPlaying = false;
      stopTimer();
      playBtn.classList.remove("loading");
      playBtn.innerHTML = '<i class="fas fa-play"></i>';
      container.classList.remove("playing");
      updateStatus("OFFLINE");
    }
  });

  // ⏹ Stop
  stopBtn.addEventListener("click", () => {
    audio.pause();
    audio.removeAttribute("src");
    audio.load();
    streamInitialized = false;

    playBtn.classList.remove("loading");
    playBtn.innerHTML = '<i class="fas fa-play"></i>';
    updateStatus("OFFLINE");
    container.classList.remove("playing");
    isPlaying = false;
    stopTimer();
  });

  // 🔇 Mute
  muteBtn.addEventListener("click", () => {
    audio.muted = !audio.muted;
    muteBtn.innerHTML = audio.muted
      ? '<i class="fas fa-volume-mute"></i>'
      : '<i class="fas fa-volume-up"></i>';
  });

  // 🔊 Volumen
  volumeSlider.addEventListener("input", e => {
    audio.volume = e.target.value;
  });
});
