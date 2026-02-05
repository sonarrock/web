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

  let timerInterval;
  let seconds = 0;
  let isPlaying = false;
  let streamInitialized = false;

  /* =========================
     CONFIGURACIÓN BÁSICA
  ========================== */
  audio.preload = "none"; // 🔥 CLAVE
  audio.crossOrigin = "anonymous";
  audio.volume = volumeSlider.value;

  /* =========================
     UI
  ========================== */
  function updateStatus(status) {
    statusText.textContent = status;
    liveDot.classList.toggle("online", status === "REPRODUCIENDO");
  }

  function startTimer() {
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      seconds++;
      timerEl.textContent =
        String(Math.floor(seconds / 60)).padStart(2, "0") + ":" +
        String(seconds % 60).padStart(2, "0");
    }, 1000);
  }

  function stopTimer() {
    clearInterval(timerInterval);
    seconds = 0;
    timerEl.textContent = "00:00";
  }

  /* =========================
     AUDIO EVENTS
  ========================== */
  audio.addEventListener("waiting", () => updateStatus("CARGANDO"));
  audio.addEventListener("playing", () => updateStatus("REPRODUCIENDO"));
  audio.addEventListener("pause", () => updateStatus("OFFLINE"));

  audio.addEventListener("error", () => {
    updateStatus("ERROR");
    isPlaying = false;
    container.classList.remove("playing");
  });

  /* =========================
     CONTROLES
  ========================== */
  playBtn.addEventListener("click", () => {
    if (!isPlaying) {

      // 🔥 Inicializar stream SOLO en el primer click
      if (!streamInitialized) {
        audio.src = STREAM_URL + "?t=" + Date.now();
        streamInitialized = true;
      }

      audio.play().then(() => {
        playBtn.innerHTML = '<i class="fas fa-pause"></i>';
        container.classList.add("playing");
        isPlaying = true;
        startTimer();
      }).catch(err => {
        console.warn("Play bloqueado:", err);
      });

    } else {
      audio.pause();
      playBtn.innerHTML = '<i class="fas fa-play"></i>';
      container.classList.remove("playing");
      isPlaying = false;
      stopTimer();
    }
  });

  stopBtn.addEventListener("click", () => {
    audio.pause();
    audio.removeAttribute("src");
    audio.load();
    streamInitialized = false;
    isPlaying = false;
    stopTimer();
    playBtn.innerHTML = '<i class="fas fa-play"></i>';
    container.classList.remove("playing");
    updateStatus("OFFLINE");
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
