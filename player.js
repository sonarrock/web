// ===============================
// UTILIDAD HORARIO (NOCHE / DÍA)
// ===============================
function isNight() {
  const h = new Date().getHours();
  return h >= 19 || h <= 6;
}

// ===============================
// ELEMENTOS
// ===============================
const audio = document.getElementById("radio-audio");
const playPauseBtn = document.getElementById("playPauseBtn");
const stopBtn = document.getElementById("stop-btn");
const muteBtn = document.getElementById("mute-btn");
const timeDisplay = document.getElementById("time-display");

audio.playsInline = true;
audio.preload = "none";

// ===============================
// TIMER FAKE (STREAM EN VIVO)
// ===============================
let timerInterval = null;
let playStartTime = null;

function startFakeTimer() {
  if (timerInterval) return;

  playStartTime = Date.now();
  timerInterval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - playStartTime) / 1000);
    const mins = Math.floor(elapsed / 60);
    const secs = elapsed % 60;

    timeDisplay.textContent =
      `${mins.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
  }, 1000);
}

function stopFakeTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
  timeDisplay.textContent = "00:00";
}

// ===============================
// MATRIX — LLUVIA REAL
// ===============================
const canvas = document.getElementById("matrixCanvas");
const ctx = canvas.getContext("2d");
const fontSize = 16;

let columns = 0;
let drops = [];
let matrixRunning = false;
let matrixFrame;

function resizeCanvas() {
  const container = document.querySelector(".player-container");
  if (!container) return;

  canvas.width = container.clientWidth;
  canvas.height = container.clientHeight;

  columns = Math.floor(canvas.width / fontSize);
  drops = Array.from({ length: columns }, () =>
    Math.floor(Math.random() * canvas.height / fontSize)
  );
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

const chars =
  "アァイィウヴエェオカガキギクグabcdefghijklmnopqrstuvwxyz0123456789".split("");

function drawMatrix() {
  if (!matrixRunning) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = `${fontSize}px monospace`;

  const night = isNight();

  for (let i = 0; i < drops.length; i++) {
    const char = chars[Math.floor(Math.random() * chars.length)];
    const x = i * fontSize;
    const y = drops[i] * fontSize;

    ctx.shadowColor = night
      ? "rgba(0,140,255,0.9)"
      : "rgba(120,220,255,0.9)";

    ctx.shadowBlur = night ? 14 : 10;

    ctx.fillStyle = night
      ? "rgba(40,120,220,0.9)"
      : "rgba(120,200,255,0.85)";

    ctx.fillText(char, x, y);

    drops[i] += night ? 1.8 : 1.1;

    if (y > canvas.height && Math.random() > 0.97) {
      drops[i] = 0;
    }
  }

  matrixFrame = requestAnimationFrame(drawMatrix);
}

function startMatrix() {
  if (matrixRunning) return;
  matrixRunning = true;
  drawMatrix();
}

function stopMatrix() {
  matrixRunning = false;
  cancelAnimationFrame(matrixFrame);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// ===============================
// VU METER (FAKE PRO)
// ===============================
const vuBars = document.querySelectorAll(".vu-meter span");
let vuActive = false;
let vuFrame;

function animateVU() {
  if (!vuActive) return;

  vuBars.forEach(bar => {
    const level = Math.random() * 0.7 + 0.25;
    bar.style.height = `${level * 100}%`;
  });

  vuFrame = requestAnimationFrame(animateVU);
}

function startVU() {
  if (vuActive) return;
  vuActive = true;
  animateVU();
}

function stopVU() {
  vuActive = false;
  cancelAnimationFrame(vuFrame);
  vuBars.forEach(bar => (bar.style.height = "20%"));
}

// ===============================
// CONTROLES — 1 CLICK REAL
// ===============================
playPauseBtn.addEventListener("click", async () => {
  if (!audio.paused) {
    audio.pause();
    return;
  }

  try {
    audio.muted = false;
    audio.volume = 1;
    await audio.play(); // 🔥 UN SOLO CLICK
  } catch (err) {
    console.warn("Play bloqueado:", err);
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
// REACCIÓN AL ESTADO DEL AUDIO
// ===============================
audio.addEventListener("playing", () => {
  document.body.classList.add("playing");
  playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
  startMatrix();
  startVU();
  startFakeTimer();
});

audio.addEventListener("pause", () => {
  document.body.classList.remove("playing");
  playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
  stopMatrix();
  stopVU();
  stopFakeTimer();
});
