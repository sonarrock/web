document.addEventListener("DOMContentLoaded", () => {

  // ===============================
  // ELEMENTOS
  // ===============================
  const audio = document.getElementById("radio-audio");
  const playPauseBtn = document.getElementById("playPauseBtn");
  const stopBtn = document.getElementById("stop-btn");
  const muteBtn = document.getElementById("mute-btn");
  const timeDisplay = document.getElementById("time-display");
  const progressBar = document.getElementById("radio-progress");

  if (!audio || !playPauseBtn) {
    console.error("❌ Elementos del reproductor no encontrados");
    return;
  }

  audio.playsInline = true;
  audio.preload = "auto";

  // ===============================
  // TIMER FAKE
  // ===============================
  let timer = null;
  let startTime = 0;

  function startTimer() {
    stopTimer();
    startTime = Date.now();
    timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const h = String(Math.floor(elapsed / 3600)).padStart(2, "0");
      const m = String(Math.floor((elapsed % 3600) / 60)).padStart(2, "0");
      const s = String(elapsed % 60).padStart(2, "0");
      timeDisplay.textContent = `${h}:${m}:${s}`;
    }, 1000);
  }

  function stopTimer() {
    clearInterval(timer);
    timer = null;
    timeDisplay.textContent = "00:00:00";
  }

  // ===============================
  // MATRIX
  // ===============================
  const canvas = document.getElementById("matrixCanvas");
  const ctx = canvas.getContext("2d");
  const fontSize = 16;
  let drops = [];
  let matrixRunning = false;

  function resizeCanvas() {
    const container = document.querySelector(".player-container");
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    drops = Array(Math.floor(canvas.width / fontSize)).fill(1);
  }

  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);

  const chars = "01ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  function drawMatrix() {
    if (!matrixRunning) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = `${fontSize}px monospace`;
    ctx.fillStyle = "rgba(0,255,180,0.75)";

    drops.forEach((y, i) => {
      const char = chars[Math.floor(Math.random() * chars.length)];
      ctx.fillText(char, i * fontSize, y * fontSize);
      drops[i] = y * fontSize > canvas.height && Math.random() > 0.97 ? 0 : y + 1;
    });

    requestAnimationFrame(drawMatrix);
  }

  function startMatrix() {
    if (matrixRunning) return;
    matrixRunning = true;
    drawMatrix();
  }

  function stopMatrix() {
    matrixRunning = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  // ===============================
  // CONTROLES
  // ===============================
  playPauseBtn.addEventListener("click", async () => {
    if (!audio.paused) {
      audio.pause();
      return;
    }

    try {
      await audio.play();
    } catch (err) {
      console.warn("⚠️ Play bloqueado", err);
    }
  });

  stopBtn.addEventListener("click", () => {
    audio.pause();
    audio.currentTime = 0;
  });

  muteBtn.addEventListener("click", () => {
    audio.muted = !audio.muted;
    muteBtn.innerHTML = audio.muted
      ? '<i class="fas fa-volume-mute"></i>'
      : '<i class="fas fa-volume-up"></i>';
  });

  const volumeSlider = document.getElementById("volume");

volumeSlider.addEventListener("input", () => {
  audio.volume = volumeSlider.value;
});


  // ===============================
  // EVENTOS AUDIO
  // ===============================
  audio.addEventListener("playing", () => {
    playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
    startTimer();
    startMatrix();
  });

  audio.addEventListener("pause", () => {
    playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
    stopTimer();
    stopMatrix();
  });

});

const liveIndicator = document.getElementById("live-indicator");
let liveActive = false;

function setLive(on) {
  if (on && !liveActive) {
    liveActive = true;
    liveIndicator.classList.add("live");
    liveIndicator.querySelector(".text").textContent = "EN VIVO";
  }

  if (!on && liveActive) {
    liveActive = false;
    liveIndicator.classList.remove("live");
    liveIndicator.querySelector(".text").textContent = "PROGRAMACIÓN";
  }
}

