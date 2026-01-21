// ==================================================
// SONAR ROCK PLAYER — FINAL CLEAN (iOS + CHROME SAFE)
// ==================================================

/* ===============================
   ELEMENTOS
================================ */
const audio = document.getElementById("radio-audio");
const playPauseBtn = document.getElementById("playPauseBtn");
const stopBtn = document.getElementById("stop-btn");
const muteBtn = document.getElementById("mute-btn");
const timeDisplay = document.getElementById("time-display");

audio.playsInline = true;
audio.preload = "none";

/* ===============================
   GESTO DE USUARIO (UNIVERSAL)
================================ */
let userInteracted = false;

function registerInteraction() {
  userInteracted = true;
}

document.addEventListener("click", registerInteraction, { once: true });
document.addEventListener("touchstart", registerInteraction, { once: true });

/* ===============================
   TIMER FAKE (STREAM EN VIVO)
================================ */
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

/* ===============================
   MATRIX EFFECT (LLUVIA REAL)
================================ */
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

  ctx.fillStyle = "rgba(0,0,0,0.08)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.font = `${fontSize}px monospace`;

  for (let i = 0; i < drops.length; i++) {
    const char = chars[Math.floor(Math.random() * chars.length)];
    const x = i * fontSize;
    const y = drops[i] * fontSize;

    ctx.shadowColor = "rgba(120,220,255,1)";
    ctx.shadowBlur = 12;
    ctx.fillStyle = "rgba(200,245,255,1)";
    ctx.fillText(char, x, y);

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

/* ===============================
   VU METER (FAKE PRO)
================================ */
const vuBars = document.querySelectorAll(".vu-meter span");
let vuActive = false;
let vuFrame;

function animateVU() {
  if (!vuActive) return;

  vuBars.forEach(bar => {
    const level = Math.random() * 0.7 + 0.2;
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

/* ===============================
   CONTROLES STREAM (CLAVE)
================================ */
playPauseBtn.addEventListener("click", () => {
  if (!userInteracted) return;

  if (audio.paused) {
    audio.muted = false;

    audio.play().then(() => {
      playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
      document.body.classList.add("playing");

      startMatrix();
      startVU();
      startFakeTimer();
    }).catch(err => {
      console.warn("Play bloqueado:", err);
    });

  } else {
    audio.pause();
  }
});

stopBtn.addEventListener("click", () => {
  audio.pause();
  audio.load();

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

/* ===============================
   PROTECCIÓN GLOBAL
================================ */
audio.addEventListener("pause", () => {
  playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
  document.body.classList.remove("playing");
  stopMatrix();
  stopVU();
  stopFakeTimer();
});
