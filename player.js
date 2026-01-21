// ===============================
// SONAR ROCK PLAYER — CLEAN & iOS SAFE
// ===============================

const audio = document.getElementById("radio-audio");
const playPauseBtn = document.getElementById("playPauseBtn");
const stopBtn = document.getElementById("stop-btn");
const muteBtn = document.getElementById("mute-btn");
const timeDisplay = document.getElementById("time-display");

audio.playsInline = true;
audio.preload = "none";

// ===============================
// iOS AUDIO UNLOCK
// ===============================
let audioUnlocked = false;

function unlockIOSAudio() {
  if (audioUnlocked) return;

  audio.muted = true;
  audio.play().then(() => {
    audio.pause();
    audio.muted = false;
    audioUnlocked = true;
  }).catch(() => {});
}

document.addEventListener("touchstart", unlockIOSAudio, { once: true });
document.addEventListener("click", unlockIOSAudio, { once: true });

// ===============================
// MATRIX
// ===============================
const canvas = document.getElementById("matrixCanvas");
const ctx = canvas.getContext("2d");
const fontSize = 16;

let drops = [];
let matrixRunning = false;
let matrixFrame;

function resizeCanvas() {
  const container = document.querySelector(".player-container");
  if (!container) return;

  canvas.width = container.clientWidth;
  canvas.height = container.clientHeight;

  const columns = Math.floor(canvas.width / fontSize);
  drops = Array(columns).fill(1);
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

const chars = "アァイィウヴエェオカガキギクグabcdefghijklmnopqrstuvwxyz0123456789".split("");

function drawMatrix() {
  if (!matrixRunning) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = `${fontSize}px monospace`;

  drops.forEach((y, i) => {
    const char = chars[Math.floor(Math.random() * chars.length)];
    const x = i * fontSize;

    ctx.shadowColor = "rgba(120,220,255,1)";
    ctx.shadowBlur = 16;
    ctx.fillStyle = "rgba(200,245,255,1)";
    ctx.fillText(char, x, y);

    drops[i] = y > canvas.height ? 0 : y + 1.2;
  });

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
// VU METER FAKE
// ===============================
const vuBars = document.querySelectorAll(".vu-meter span");
let vuActive = false;
let vuFrame;
let vuLevels = Array(vuBars.length).fill(0.2);

function animateVU() {
  if (!vuActive) return;

  vuBars.forEach((bar, i) => {
    const target = Math.random() * 0.8 + 0.2;
    vuLevels[i] += (target - vuLevels[i]) * 0.3;
    bar.style.height = `${vuLevels[i] * 100}%`;
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
  vuBars.forEach(bar => bar.style.height = "20%");
}

// ===============================
// TIMER FAKE STREAM
// ===============================
let timerInterval = null;
let playStartTime = 0;

function startFakeTimer() {
  stopFakeTimer();
  playStartTime = Date.now();

  timerInterval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - playStartTime) / 1000);
    const mins = Math.floor(elapsed / 60);
    const secs = elapsed % 60;

    timeDisplay.textContent =
      `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }, 1000);
}

function stopFakeTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
  timeDisplay.textContent = "00:00";
}

// ===============================
// CONTROLES STREAM
// ===============================
playPauseBtn.addEventListener("click", () => {
  if (audio.paused) {
    audio.muted = false;
    audio.play();

    playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
    document.body.classList.add("playing");

    startMatrix();
    startVU();
    startFakeTimer();
  } else {
    audio.pause();
  }
});

stopBtn.addEventListener("click", () => {
  audio.pause();

  playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
  document.body.classList.remove("playing");

  stopMatrix();
  stopVU();
  stopFakeTimer();
});

muteBtn.addEventListener("click", () => {
  audio.muted = !audio.muted;
  muteBtn.innerHTML = audio.muted
    ? '<i class="fas fa-volume-mute"></i>'
    : '<i class="fas fa-volume-up"></i>';
});

audio.addEventListener("pause", () => {
  playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
  document.body.classList.remove("playing");
  stopMatrix();
  stopVU();
  stopFakeTimer();
});
