// ========================================
// SONAR ROCK - RADIO PLAYER PROFESIONAL
// ========================================

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
  const MAX_RECONNECT_ATTEMPTS = 6;

  let timerInterval;
  let reconnectTimer;
  let reconnectAttempts = 0;
  let seconds = 0;
  let isPlaying = false;
  let streamInitialized = false;
  let userMuted = localStorage.getItem("radioMuted") === "true";

  // 🔥 CONTROL GLOBAL ENTRE TODOS LOS AUDIOS HTML5
  window.globalActiveAudio = null;

  // =========================
  // CONFIGURACIÓN INICIAL
  // =========================
  audio.preload = "none";
  audio.crossOrigin = "anonymous";
  audio.volume = parseFloat(localStorage.getItem("radioVolume")) || 1;
  volumeSlider.value = audio.volume;
  audio.muted = userMuted;

  muteBtn.innerHTML = audio.muted
    ? '<i class="fas fa-volume-mute"></i>'
    : '<i class="fas fa-volume-up"></i>';

  updateStatus("OFFLINE");

  // =========================
  // CONTROL GLOBAL ENTRE PLAYERS
  // =========================
  document.querySelectorAll("audio").forEach(player => {
    player.addEventListener("play", () => {
      if (window.globalActiveAudio && window.globalActiveAudio !== player) {
        window.globalActiveAudio.pause();
      }
      window.globalActiveAudio = player;
    });
  });

  // =========================
  // STATUS
  // =========================
  function updateStatus(status) {
    statusText.textContent = status.toUpperCase();
  }

  // =========================
  // TIMER
  // =========================
  function startTimer() {
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      seconds++;
      const m = String(Math.floor(seconds / 60)).padStart(2,"0");
      const s = String(seconds % 60).padStart(2,"0");
      timerEl.textContent = `${m}:${s}`;
    },1000);
  }

  function stopTimer() {
    clearInterval(timerInterval);
    seconds = 0;
    timerEl.textContent = "00:00";
  }

  // =========================
  // RECONEXIÓN INTELIGENTE
  // =========================
  function tryReconnect() {

    if (!isPlaying) return;

    clearTimeout(reconnectTimer);

    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      updateStatus("ERROR");
      resetUI();
      return;
    }

    reconnectAttempts++;
    updateStatus("REINTENTANDO");

    const delay = Math.min(3000 * reconnectAttempts, 15000);

    reconnectTimer = setTimeout(() => {
      audio.src = STREAM_URL + "?t=" + Date.now();
      audio.load();
      audio.play().catch(() => tryReconnect());
    }, delay);
  }

  // =========================
  // EVENTOS AUDIO
  // =========================
  audio.addEventListener("waiting", () => {
    if (isPlaying) updateStatus("CARGANDO");
  });

  audio.addEventListener("playing", () => {
    updateStatus("REPRODUCIENDO");
    container.classList.add("playing");
    playBtn.innerHTML = '<i class="fas fa-pause"></i>';
    reconnectAttempts = 0;
    startTimer();
  });

  audio.addEventListener("pause", () => {
    if (!audio.ended) {
      isPlaying = false;
      stopTimer();
      container.classList.remove("playing");
      playBtn.innerHTML = '<i class="fas fa-play"></i>';
      updateStatus("OFFLINE");
    }
  });

  audio.addEventListener("error", tryReconnect);
  audio.addEventListener("stalled", tryReconnect);
  audio.addEventListener("ended", tryReconnect);

  // =========================
  // PLAY / PAUSE
  // =========================
  playBtn.addEventListener("click", () => {

    if (!isPlaying) {

      // 🔥 Cerrar cualquier otro audio activo
      if (window.globalActiveAudio && window.globalActiveAudio !== audio) {
        window.globalActiveAudio.pause();
      }

      window.globalActiveAudio = audio;

      if (!streamInitialized) {
        audio.src = STREAM_URL + "?t=" + Date.now();
        streamInitialized = true;
      }

      audio.load();
      updateStatus("CARGANDO");

      audio.play().then(() => {
        isPlaying = true;
      }).catch(err => {
        console.warn("Play bloqueado:", err);
        resetUI();
      });

    } else {
      audio.pause();
    }

  });

  // =========================
  // STOP
  // =========================
  stopBtn.addEventListener("click", () => {
    audio.pause();
    audio.removeAttribute("src");
    audio.load();
    streamInitialized = false;
    reconnectAttempts = 0;
    resetUI();
  });

  function resetUI() {
    isPlaying = false;
    stopTimer();
    container.classList.remove("playing");
    playBtn.innerHTML = '<i class="fas fa-play"></i>';
    updateStatus("OFFLINE");
  }

  // =========================
  // MUTE
  // =========================
  muteBtn.addEventListener("click", () => {
    audio.muted = !audio.muted;
    userMuted = audio.muted;
    localStorage.setItem("radioMuted", userMuted);

    muteBtn.innerHTML = audio.muted
      ? '<i class="fas fa-volume-mute"></i>'
      : '<i class="fas fa-volume-up"></i>';
  });

  // =========================
  // VOLUMEN
  // =========================
  volumeSlider.addEventListener("input", e => {
    audio.volume = e.target.value;
    localStorage.setItem("radioVolume", e.target.value);
  });

});
