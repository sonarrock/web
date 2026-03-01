// =====================================================
// SONAR ROCK - RADIO PLAYER PRO EDITION
// =====================================================

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

  // =============================
  // VARIABLES PRO
  // =============================

  let isPlaying = false;
  let streamInitialized = false;
  let reconnectAttempts = 0;
  let reconnectTimer = null;
  let timerInterval = null;
  let freezeMonitor = null;
  let lastCurrentTime = 0;
  let seconds = 0;
  let clickLock = false;

  const BASE_DELAY = 2000;
  const MAX_DELAY = 20000;

  window.globalActiveAudio = null;

  // =============================
  // CONFIGURACIÓN INICIAL
  // =============================

  audio.preload = "none";
  audio.crossOrigin = "anonymous";
  audio.volume = parseFloat(localStorage.getItem("radioVolume")) || 1;
  volumeSlider.value = audio.volume;

  const savedMuted = localStorage.getItem("radioMuted") === "true";
  audio.muted = savedMuted;

  muteBtn.innerHTML = audio.muted
    ? '<i class="fas fa-volume-mute"></i>'
    : '<i class="fas fa-volume-up"></i>';

  updateStatus("OFFLINE");

  // =============================
  // CONTROL GLOBAL ENTRE AUDIOS
  // =============================

  document.querySelectorAll("audio").forEach(player => {
    player.addEventListener("play", () => {
      if (window.globalActiveAudio && window.globalActiveAudio !== player) {
        window.globalActiveAudio.pause();
      }
      window.globalActiveAudio = player;
    });
  });

  // =============================
  // STATUS
  // =============================

  function updateStatus(status) {
    statusText.textContent = status.toUpperCase();
  }

  // =============================
  // TIMER
  // =============================

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

  // =============================
  // MONITOR DE CONGELAMIENTO
  // =============================

  function startFreezeMonitor() {
    clearInterval(freezeMonitor);
    freezeMonitor = setInterval(() => {
      if (!audio.paused) {
        if (audio.currentTime === lastCurrentTime) {
          console.warn("Stream congelado detectado");
          forceReconnect();
        }
        lastCurrentTime = audio.currentTime;
      }
    }, 8000);
  }

  function stopFreezeMonitor() {
    clearInterval(freezeMonitor);
  }

  // =============================
  // RECONEXIÓN PROGRESIVA INFINITA
  // =============================

  function forceReconnect() {
    if (!isPlaying) return;

    clearTimeout(reconnectTimer);

    reconnectAttempts++;

    updateStatus("RECONectando");

    const delay = Math.min(BASE_DELAY * reconnectAttempts, MAX_DELAY);

    reconnectTimer = setTimeout(() => {
      audio.src = STREAM_URL + "?t=" + Date.now();
      audio.load();
      audio.play().catch(() => forceReconnect());
    }, delay);
  }

  // =============================
  // INTERNET OFFLINE / ONLINE
  // =============================

  window.addEventListener("offline", () => {
    updateStatus("SIN INTERNET");
  });

  window.addEventListener("online", () => {
    if (isPlaying) {
      updateStatus("RECUPERANDO");
      forceReconnect();
    }
  });

  // =============================
  // EVENTOS AUDIO
  // =============================

  audio.addEventListener("waiting", () => {
    if (isPlaying) updateStatus("BUFFERING");
  });

  audio.addEventListener("playing", () => {
    updateStatus("REPRODUCIENDO");
    container.classList.add("playing");
    playBtn.innerHTML = '<i class="fas fa-pause"></i>';
    reconnectAttempts = 0;
    startTimer();
    startFreezeMonitor();
  });

  audio.addEventListener("pause", () => {
    if (!audio.ended) resetUI();
  });

  audio.addEventListener("stalled", forceReconnect);
  audio.addEventListener("error", forceReconnect);
  audio.addEventListener("ended", forceReconnect);

  // =============================
  // PLAY / PAUSE CON ANTI DOBLE CLICK
  // =============================

  playBtn.addEventListener("click", () => {

    if (clickLock) return;
    clickLock = true;
    setTimeout(() => clickLock = false, 800);

    if (!isPlaying) {

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

  // =============================
  // STOP
  // =============================

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
    stopFreezeMonitor();
    container.classList.remove("playing");
    playBtn.innerHTML = '<i class="fas fa-play"></i>';
    updateStatus("OFFLINE");
  }

  // =============================
  // MUTE
  // =============================

  muteBtn.addEventListener("click", () => {
    audio.muted = !audio.muted;
    localStorage.setItem("radioMuted", audio.muted);
    muteBtn.innerHTML = audio.muted
      ? '<i class="fas fa-volume-mute"></i>'
      : '<i class="fas fa-volume-up"></i>';
  });

  // =============================
  // VOLUMEN
  // =============================

  volumeSlider.addEventListener("input", e => {
    audio.volume = e.target.value;
    localStorage.setItem("radioVolume", e.target.value);
  });

});
