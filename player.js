document.addEventListener("DOMContentLoaded", () => {
  const audio = document.getElementById("radio-audio");
  const playBtn = document.getElementById("playPauseBtn");
  const stopBtn = document.getElementById("stop-btn");
  const muteBtn = document.getElementById("mute-btn");
  const volumeSlider = document.getElementById("volume");
  const statusText = document.getElementById("status-text");
  const timerEl = document.getElementById("timer");
  const container = document.querySelector(".player-container");
  const liveDot = document.querySelector(".live-badge .dot");

  const STREAM_URL = "https://stream.zeno.fm/ezq3fcuf5ehvv";

  let reconnectTimer;
  let timerInterval;
  let seconds = 0;
  let isPlaying = false;
  let streamLoaded = false;

  /* =========================
     CONFIGURACIÓN CLAVE
  ========================== */
  audio.preload = "auto";
  audio.crossOrigin = "anonymous";
  audio.volume = volumeSlider.value;
  playBtn.disabled = true;

  function loadStream() {
    audio.src = STREAM_URL + "?t=" + Date.now(); // evita cache
    audio.load();
    streamLoaded = true;
  }

  loadStream();

  /* =========================
     UI / ESTADO
  ========================== */
  function updateStatus(status) {
    statusText.textContent = status;
    if (status === "REPRODUCIENDO") {
      liveDot.classList.add("online");
    } else {
      liveDot.classList.remove("online");
    }
  }

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
     EVENTOS DE AUDIO
  ========================== */
  audio.addEventListener("canplay", () => {
    playBtn.disabled = false;
  });

  audio.addEventListener("waiting", () => {
    updateStatus("CARGANDO");
  });

  audio.addEventListener("playing", () => {
    updateStatus("REPRODUCIENDO");
  });

  function tryReconnect() {
    clearTimeout(reconnectTimer);
    updateStatus("OFFLINE");
    isPlaying = false;
    container.classList.remove("playing");

    reconnectTimer = setTimeout(() => {
      loadStream();
      audio.play().catch(() => {});
    }, 2000);
  }

  audio.addEventListener("error", tryReconnect);
  audio.addEventListener("stalled", tryReconnect);
  audio.addEventListener("ended", tryReconnect);

  /* =========================
     CONTROLES
  ========================== */
  playBtn.addEventListener("click", () => {
    if (!isPlaying) {
      if (!streamLoaded) loadStream();

      audio.play().then(() => {
        playBtn.innerHTML = '<i class="fas fa-pause"></i>';
        container.classList.add("playing");
        isPlaying = true;
        startTimer();
      }).catch(err => console.log("Play bloqueado:", err));
    } else {
      audio.pause();
      playBtn.innerHTML = '<i class="fas fa-play"></i>';
      updateStatus("OFFLINE");
      container.classList.remove("playing");
      isPlaying = false;
      stopTimer();
    }
  });

  stopBtn.addEventListener("click", () => {
    audio.pause();
    audio.removeAttribute("src");
    audio.load();
    playBtn.innerHTML = '<i class="fas fa-play"></i>';
    updateStatus("OFFLINE");
    container.classList.remove("playing");
    isPlaying = false;
    streamLoaded = false;
    stopTimer();
  });

  muteBtn.addEventListener("click", () => {
    audio.muted = !audio.muted;
    muteBtn.innerHTML = audio.muted
      ? '<i class="fas fa-volume-mute"></i>'
      : '<i class="fas fa-volume-up"></i>';
  });

  volumeSlider.addEventListener("input", e => {
    audio.volume = e.target.value;
  });

  /* =========================
     ESTADO INICIAL
  ========================== */
  updateStatus("OFFLINE");
});
