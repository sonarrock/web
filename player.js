// ===================
// SONAR ROCK PLAYER 
// ===================

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
   MATRIX — LLUVIA REAL (SIN OSCURECER)
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
  "アァイィウヴエェオカガキギクグا ب ت ث ج ح خ د ذ ر ز س ش ص ض ط ظ ع غ ف ق ك ل م ن ه و يabcdefghijklmnopqrstuvwxyz0123456789".split("");

function drawMatrix() {
  if (!matrixRunning) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
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

function drawMatrix() {
  if (!matrixRunning) return;

  // limpieza transparente (NO tapa la imagen)
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.font = `${fontSize}px monospace`;

  for (let i = 0; i < drops.length; i++) {
    const char = chars[Math.floor(Math.random() * chars.length)];
    const x = i * fontSize;
    const y = drops[i] * fontSize;

    // color agresivo pero oscuro
    ctx.shadowColor = "rgba(0,180,255,0.9)";
    ctx.shadowBlur = 10;

    ctx.fillStyle = "rgba(80,160,255,0.85)";
    ctx.fillText(char, x, y);

    // cola más oscura
    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(40,80,140,0.35)";
    ctx.fillText(char, x, y - fontSize);

    // velocidad irregular (agresiva)
    drops[i] += Math.random() * 1.5 + 0.5;

    if (y > canvas.height && Math.random() > 0.96) {
      drops[i] = 0;
    }
  }

  matrixFrame = requestAnimationFrame(drawMatrix);
}

function stopMatrix() {
  matrixRunning = false;
  cancelAnimationFrame(matrixFrame);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

/* ===============================
   VU METER (FAKE)
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
   CONTROLES STREAM — 1 CLICK REAL
================================ */
let isPlaying = false;
let playRequested = false;

playPauseBtn.addEventListener("click", () => {
  if (isPlaying) {
    audio.pause();
    return;
  }

  if (playRequested) return; // evita multi-click
  playRequested = true;

  audio.muted = false;
  audio.volume = 1;

  audio.play().catch(() => {});
});

// 🔥 SOLO CUANDO EL AUDIO REALMENTE ARRANCA
audio.addEventListener("playing", () => {
  isPlaying = true;
  playRequested = false;

  playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
  document.body.classList.add("playing");

  startMatrix();
  startVU();
  startFakeTimer();
});

audio.addEventListener("pause", () => {
  isPlaying = false;
  playRequested = false;

  playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
  document.body.classList.remove("playing");

  stopMatrix();
  stopVU();
  stopFakeTimer();
});

/* ===============================
   BOTONES
================================ */
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
