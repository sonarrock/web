// ===============================
// SONAR ROCK PLAYER – FINAL
// ===============================

const audio = document.getElementById("radio-audio");
const playPauseBtn = document.getElementById("playPauseBtn");
const stopBtn = document.getElementById("stop-btn");
const muteBtn = document.getElementById("mute-btn");
const timeDisplay = document.getElementById("time-display");
const progressBar = document.getElementById("radio-progress");

// iOS safe
audio.playsInline = true;
audio.preload = "auto";

// ===============================
// CONTADOR FAKE (STREAM)
// ===============================
let timerInterval = null;
let startTime = 0;

function startTimer() {
  stopTimer();
  startTime = Date.now();

  timerInterval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const h = Math.floor(elapsed / 3600);
    const m = Math.floor((elapsed % 3600) / 60);
    const s = elapsed % 60;

    timeDisplay.textContent =
      `${h.toString().padStart(2, "0")}:` +
      `${m.toString().padStart(2, "0")}:` +
      `${s.toString().padStart(2, "0")}`;
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
  timeDisplay.textContent = "00:00:00";
}

// ===============================
// MATRIX
// ===============================
const canvas = document.getElementById("matrixCanvas");
const ctx = canvas.getContext("2d");
const fontSize = 16;
let drops = [];
let running = false;

function resizeCanvas() {
  const container = document.querySelector(".player-container");
  canvas.width = container.clientWidth;
  canvas.height = container.clientHeight;
  const columns = Math.floor(canvas.width / fontSize);
  drops = Array(columns).fill(1);
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

const chars = "01ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

function drawMatrix() {
  if (!running) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = `${fontSize}px monospace`;
  ctx.fillStyle = "rgba(0,255,180,0.75)";

  drops.forEach((y, i) => {
    const text = chars[Math.floor(Math.random() * chars.length)];
    ctx.fillText(text, i * fontSize, y * fontSize);
    drops[i] = y * fontSize > canvas.height && Math.random() > 0.975 ? 0 : y + 1;
  });

  requestAnimationFrame(drawMatrix);
}

function startMatrix() {
  if (running) return;
  running = true;
  drawMatrix();
}

function stopMatrix() {
  running = false;
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
    startTimer();
    startMatrix();
    playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
  } catch (err) {
    console.warn("Play bloqueado:", err);
  }
});

stopBtn.addEventListener("click", () => {
  audio.pause();
  audio.currentTime = 0;
  stopTimer();
  stopMatrix();
  playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
});

muteBtn.addEventListener("click", () => {
  audio.muted = !audio.muted;
  muteBtn.innerHTML = audio.muted
    ? '<i class="fas fa-volume-mute"></i>'
    : '<i class="fas fa-volume-up"></i>';
});

// ===============================
// ESTADOS AUDIO
// ===============================
audio.addEventListener("pause", () => {
  stopMatrix();
  stopTimer();
  playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
});
