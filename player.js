// ===============================
// SONAR ROCK PLAYER 
// ===============================

// ELEMENTOS
const audio = document.getElementById("radio-audio");
const playPauseBtn = document.getElementById("playPauseBtn");
const stopBtn = document.getElementById("stop-btn");
const muteBtn = document.getElementById("mute-btn");
const timeDisplay = document.getElementById("time-display");
const canvas = document.getElementById("matrixCanvas");
const ctx = canvas.getContext("2d");

// CONFIG AUDIO iOS
audio.playsInline = true;
audio.preload = "none";

// ===============================
// iOS AUDIO UNLOCK (1 SOLO GESTO)
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
// MATRIX EFFECT (LLUVIA REAL)
// ===============================
const fontSize = 16;
let drops = [];
let matrixRunning = false;
let matrixFrame;

const chars =
  "アァイィウヴエェオカガキギクグabcdefghijklmnopqrstuvwxyz0123456789".split("");

function resizeCanvas() {
  const container = document.querySelector(".player-container");
  if (!container) return;

  canvas.width = container.clientWidth;
  canvas.height = container.clientHeight;

  const columns = Math.floor(canvas.width / fontSize);
  drops = Array.from(
    { length: columns },
    () => Math.floor(Math.random() * canvas.height / fontSize)
  );
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

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

    if (y > canvas.height && Math.random() > 0.975) {
      drops[i] = 0;
    }
    drops[i]++;
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
// VU METER FAKE (AZUL)
// ===============================
const vuBars = document.querySelectorAll(".vu-meter span");
let vuActive = false;
let vuFrame;
let vuLevels = Array(vuBars.length).fill(0.2);

function animateVU() {
  if (!vuActive) return;

  vuBars.forEach((bar, i) => {
    const target = Math.random() * 0.8 + 0.2;
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
// TIMER FAKE (STREAM EN VIVO)
// ===============================
let playStartTime = null;
let timerInterval = null;

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
// CONTROLES STREAM (ESTABLE)
// ===============================
playPauseBtn.addEventListener("click", async () => {
  if (audio.paused) {
    try {
      audio.muted = false;
      await audio.play();

      playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
      document.body.classList.add("playing");

      startMatrix();
      startVU();
      startFakeTimer();
    } catch (e) {
      console.warn("Bloqueo de reproducción");
    }
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

// ===============================
// PROTECCIÓN GLOBAL
// ===============================
audio.addEventListener("pause", () => {
  playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
  document.body.classList.remove("playing");
  stopMatrix();
  stopVU();
  stopFakeTimer();
});

// ===============================
// LIVE STATUS (PROGRAMACIÓN / EN VIVO)
// ===============================
const liveIndicator = document.getElementById("live-indicator");
const liveText = liveIndicator.querySelector(".text");

async function checkLiveStatus() {
  try {
    const response = await fetch(
      "https://corsproxy.io/?https://api.zeno.fm/mounts/metadata/ezq3fcuf5ehvv"
    );

    const data = await response.json();
    const title = (data.streamTitle || "").toUpperCase();

    const isLive =
      title.includes("LIVE") ||
      title.includes("

