document.addEventListener("DOMContentLoaded", () => {

  // ===============================
  // ELEMENTOS
  // ===============================
  const audio = document.getElementById("radio-audio");
  const playPauseBtn = document.getElementById("playPauseBtn");
  const stopBtn = document.getElementById("stop-btn");
  const muteBtn = document.getElementById("mute-btn");
  const timeDisplay = document.getElementById("time-display");
  const canvas = document.getElementById("matrixCanvas");
  const liveIndicator = document.getElementById("live-indicator");

  if (!audio || !playPauseBtn || !canvas || !liveIndicator) {
    console.error("❌ Elementos críticos no encontrados");
    return;
  }

  const liveText = liveIndicator.querySelector(".text");

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
      const m = String(Math.floor(elapsed / 60)).padStart(2, "0");
      const s = String(elapsed % 60).padStart(2, "0");
      timeDisplay.textContent = `${m}:${s}`;
    }, 1000);
  }

  function stopTimer() {
    clearInterval(timer);
    timer = null;
    timeDisplay.textContent = "00:00";
  }

  // ===============================
  // MATRIX
  // ===============================
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

  const chars = "01ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  function drawMatrix() {
    if (!matrixRunning) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = `${fontSize}px monospace`;
    ctx.fillStyle = "rgba(0,255,180,0.8)";

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
  // LIVE STATUS
  // ===============================
  let liveActive = false;

  function setLive(on) {
    if (!liveText) return;

    if (on && !liveActive) {
      liveActive = true;
      liveIndicator.classList.remove("auto");
      liveIndicator.classList.add("live");
      liveText.textContent = "EN VIVO";
    }

    if (!on && liveActive) {
      liveActive = false;
      liveIndicator.classList.remove("live");
      liveIndicator.classList.add("auto");
      liveText.textContent = "PROGRAMACIÓN";
    }
  }

  // ===============================
  // CONTROLES (ÚNICO PLAY)
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

  // ===============================
  // EVENTOS AUDIO
  // ===============================
  audio.addEventListener("playing", () => {
    playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
    startTimer();
    startMatrix();
    setLive(true);
  });

  audio.addEventListener("pause", () => {
    playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
    stopTimer();
    stopMatrix();
    setLive(false);
  });

  audio.addEventListener("error", () => {
    setLive(false);
  });

});

