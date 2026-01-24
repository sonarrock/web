// ===================
// UTILIDADES
// ===================
const isNight = () => {
  const h = new Date().getHours();
  return h >= 19 || h <= 6;
};

// ===================
// ELEMENTOS
// ===================
const audio = document.getElementById("radio-audio");
const playPauseBtn = document.getElementById("playPauseBtn");
const stopBtn = document.getElementById("stop-btn");
const muteBtn = document.getElementById("mute-btn");
const timeDisplay = document.getElementById("time-display");

audio.playsInline = true;
audio.preload = "none";

// ===================
// TIMER FAKE
// ===================
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

// ===================
// MATRIX CANVAS
// ===================
const canvas = document.getElementById("matrixCanvas");
const ctx = canvas.getContext("2d");

const fontSize = 16;
let columns = 0;
let drops = [];
let matrixRunning = false;
let matrixFrame = null;

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

    ctx.shadowColor = night ? "rgba(0,140,255,1)" : "rgba(120,220,255,0.9)";
    ctx.shadowBlur = night ? 14 : 8;

    ctx.fillStyle = night
      ? "rgba(40,120,220,0.9)"
      : "rgba(120,200,255,0.85)";

    ctx.fillText(char, x, y);

    ctx.shadowBlur = 0;
    ctx.fillStyle = night
      ? "rgba(20,60,120,0.35)"
      : "rgba(60,120,180,0.3)";

    ctx.fillText(char, x, y - fontSize);

    drops[i] += night ? Math.random() * 2 + 1 : Math.random() * 1.3 + 0.6;

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

// ===================
// VU METER (FAKE)
// ===================
const vuBars = document.querySelectorAll(".vu-meter span");
let vuActive = false;
let vuFrame = null;

function animateVU() {
  if (!vuActive) return;

  // suavizado tipo compresor
  beatLevel += (beatTarget - beatLevel) * 0.25;

  vuBars.forEach(bar => {
    const random = Math.random() * 0.3;
    const level = Math.min(1, beatLevel + random);

    bar.style.height = `${level * 100}%`;
  });

  vuFrame = requestAnimationFrame(animateVU);
}

/* ===============================
   BEAT FAKE ENGINE (PRO)
================================ */
let beatLevel = 0;
let beatTarget = 0;

setInterval(() => {
  // golpe aleatorio tipo beat
  beatTarget = Math.random() > 0.6
    ? Math.random() * 0.8 + 0.6
    : Math.random() * 0.3;
}, 420); // ~140 BPM feel

// ===================
// CONTROLES
// ===================
playPauseBtn.addEventListener("click", async () => {
  if (!audio.paused) {
    audio.pause();
    return;
  }

  try {
    audio.muted = false;
    audio.volume = 1;
    await audio.play();
  } catch (err) {
    console.warn("Play bloqueado por el navegador", err);
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

// ===================
// EVENTOS AUDIO
// ===================
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


/* ===============================
   AUTO RECOVERY STREAM (PRO)
================================ */

let reconnectTimer = null;
let silenceTimer = null;
let lastCurrentTime = 0;
let reconnecting = false;

const RECONNECT_DELAY = 3000; // 3 segundos
const SILENCE_LIMIT = 6000;   // 6 segundos sin avance

function startWatchdog() {
  stopWatchdog();

  silenceTimer = setInterval(() => {
    if (audio.paused || audio.readyState < 2) return;

    if (audio.currentTime === lastCurrentTime) {
      console.warn("⛔ Stream congelado, reconectando...");
      reconnectStream();
    }

    lastCurrentTime = audio.currentTime;
  }, SILENCE_LIMIT);
}

function stopWatchdog() {
  clearInterval(silenceTimer);
  silenceTimer = null;
}

async function reconnectStream() {
  if (reconnecting) return;
  reconnecting = true;

  document.body.classList.add("reconnecting");

  try {
    audio.pause();
    audio.src = audio.src; // fuerza reload
    await audio.play();
  } catch (e) {
    console.warn("⏳ Reintento fallido, nuevo intento...");
  }

  reconnectTimer = setTimeout(() => {
    reconnecting = false;
    document.body.classList.remove("reconnecting");
  }, RECONNECT_DELAY);
}

/* ===============================
   EVENTOS CRÍTICOS
================================ */

audio.addEventListener("playing", () => {
  startWatchdog();
});

audio.addEventListener("pause", () => {
  stopWatchdog();
});

audio.addEventListener("stalled", () => {
  console.warn("⚠️ Stream stalled");
  reconnectStream();
});

audio.addEventListener("error", () => {
  console.warn("🔥 Error de stream");
  reconnectStream();
});
