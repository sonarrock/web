// ===============================
// SONAR ROCK PLAYER — CLEAN & iOS SAFE
// ===============================

const audio = document.getElementById("radio-audio");
const playPauseBtn = document.getElementById("playPauseBtn");
const stopBtn = document.getElementById("stop-btn");
const muteBtn = document.getElementById("mute-btn");
const timeDisplay = document.getElementById("time-display");

// ===============================
// iOS AUDIO UNLOCK
// ===============================
let audioUnlocked = false;

function unlockIOSAudio() {
  if (audioUnlocked) return;

  audio.muted = true;
  audio.play()
    .then(() => {
      audio.pause();
      audio.muted = false;
      audioUnlocked = true;
      console.log("🔓 iOS audio unlocked");
    })
    .catch(() => {});
}

document.addEventListener("touchstart", unlockIOSAudio, { once: true });
document.addEventListener("click", unlockIOSAudio, { once: true });

// ===============================
// MATRIX
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
  drops = Array(columns).fill(1);
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

const chars = "アァイィウヴエェオカガキギクグabcdefghijklmnopqrstuvwxyz0123456789".split("");

function drawMatrix() {
  if (!matrixRunning) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = `${fontSize}px monospace`;

  for (let i = 0; i < drops.length; i++) {
    const char = chars[Math.floor(Math.random() * chars.length)];
    const x = i * fontSize;
    const y = drops[i] * fontSize;

    ctx.shadowColor = "rgba(120,220,255,1)";
    ctx.shadowBlur = 16;
    ctx.fillStyle = "rgba(200,245,255,1)";
    ctx.fillText(char, x, y);

    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(120,200,255,0.35)";
    ctx.fillText(char, x, y - fontSize);

    if (y > canvas.height && Math.random() > 0.975) drops[i] = 0;
    drops[i] += matrixRunning ? 1.2 : 0.5;

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
// REACCIÓN AL ESTADO DEL STREAM
// ===============================
audio.addEventListener("playing", () => {
  startMatrix();
  startVU();
});

audio.addEventListener("waiting", () => {
  // buffer: matrix más lenta + VU más bajo
  vuLevels = vuLevels.map(() => 0.25);
});

audio.addEventListener("pause", () => {
  stopMatrix();
  stopVU();
});

// ===============================
// VU METER ANALÓGICO (FAKE PRO)
// ===============================
const vuBars = document.querySelectorAll(".vu-meter span");
let vuActive = false;
let vuFrame;
let vuLevels = Array(vuBars.length).fill(0.2);

function animateVU() {
  if (!vuActive) return;

  vuBars.forEach((bar, i) => {
    // subida rápida
    const target = Math.random() * 0.8 + 0.2;

    // caída lenta tipo analógico
    vuLevels[i] += (target - vuLevels[i]) * 0.25;
    vuLevels[i] = Math.max(0.15, vuLevels[i]);

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
// TIEMPO FAKE (DESDE PLAY)
// ===============================
let playSeconds = 0;
let timeTimer = null;

function startTimer() {
  stopTimer();
  playSeconds = 0;
  timeDisplay.textContent = "00:00";

  timeTimer = setInterval(() => {
    playSeconds++;
    const m = Math.floor(playSeconds / 60);
    const s = playSeconds % 60;
    timeDisplay.textContent =
      `${m.toString().padStart(2,"0")}:${s.toString().padStart(2,"0")}`;
  }, 1000);
}

function stopTimer() {
  clearInterval(timeTimer);
  timeTimer = null;
}

// ===============================
// CONTROLES STREAM (iOS SAFE)
// ===============================
playPauseBtn.addEventListener("click", () => {
  if (audio.paused) {
    audio.muted = false;
    audio.play();

    playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
    document.body.classList.add("playing");

    startMatrix();
    startVU();
    startTimer();
  } else {
    audio.pause();
  }
});

stopBtn.addEventListener("click", () => {
  audio.pause();
  audio.currentTime = 0;

  playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
  document.body.classList.remove("playing");

  stopMatrix();
  stopVU();
  stopTimer();
  timeDisplay.textContent = "00:00";
});

muteBtn.addEventListener("click", () => {
  audio.muted = !audio.muted;
  muteBtn.innerHTML = audio.muted
    ? '<i class="fas fa-volume-mute"></i>'
    : '<i class="fas fa-volume-up"></i>';
});

// ===============================
// PROTECCIÓN GLOBAL
// ===============================
audio.addEventListener("pause", () => {
  playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
  document.body.classList.remove("playing");
  stopMatrix();
  stopVU();
  stopTimer();
});
