// ===============================
// SONAR ROCK PLAYER + MATRIX (iOS FIX FINAL)
// ===============================

const audio = document.getElementById("radio-audio");
const playPauseBtn = document.getElementById("playPauseBtn");
const stopBtn = document.getElementById("stop-btn");
const muteBtn = document.getElementById("mute-btn");

// ===============================
// DESBLOQUEO iOS (CORRECTO)
// ===============================
let audioUnlocked = false;

function unlockIOSAudio() {
  if (audioUnlocked) return;

  audio.muted = true;
  audio.play().then(() => {
    audio.pause();
    audio.muted = false;
    audioUnlocked = true;
    console.log("🔓 iOS Audio Unlocked");
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

let columns = 0;
let drops = [];
let animationRunning = false;
let animationFrameId = null;

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

const chars =
  "アァイィウヴエェオカガキギクグabcdefghijklmnopqrstuvwxyz0123456789".split("");

function drawMatrix() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = `${fontSize}px monospace`;

  for (let i = 0; i < drops.length; i++) {
    const text = chars[Math.floor(Math.random() * chars.length)];
    const x = i * fontSize;
    const y = drops[i] * fontSize;

    ctx.shadowColor = "rgba(120,220,255,1)";
    ctx.shadowBlur = 16;
    ctx.fillStyle = "rgba(200,245,255,1)";
    ctx.fillText(text, x, y);

    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(120,200,255,0.35)";
    ctx.fillText(text, x, y - fontSize);

    if (y > canvas.height && Math.random() > 0.975) drops[i] = 0;
    drops[i]++;
  }

  animationFrameId = requestAnimationFrame(drawMatrix);
}

function startMatrix() {
  if (!animationRunning) {
    animationRunning = true;
    drawMatrix();
  }
}

function stopMatrix() {
  animationRunning = false;
  cancelAnimationFrame(animationFrameId);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// ===============================
// CONTROLES STREAM (100% iOS SAFE)
// ===============================
playPauseBtn.addEventListener("click", () => {
  if (audio.paused) {
    audio.muted = false;
    audio.play(); // 👈 SOLO AQUÍ SE REPRODUCE

    playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
    document.body.classList.add("playing");
    startMatrix();
  } else {
    audio.pause();
  }
});

stopBtn.addEventListener("click", () => {
  audio.pause();
  playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
  document.body.classList.remove("playing");
  stopMatrix();
});

muteBtn.addEventListener("click", () => {
  audio.muted = !audio.muted;
  muteBtn.innerHTML = audio.muted
    ? '<i class="fas fa-volume-mute"></i>'
    : '<i class="fas fa-volume-up"></i>';
});

// ===============================
// PROTECCIÓN iOS
// ===============================
audio.addEventListener("pause", () => {
  stopMatrix();
  playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
  document.body.classList.remove("playing");
});
