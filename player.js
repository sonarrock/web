// ===============================
// SONAR ROCK PLAYER PRO
// ===============================

const audio = document.getElementById("radio-audio");
const playPauseBtn = document.getElementById("playPauseBtn");
const stopBtn = document.getElementById("stop-btn");
const muteBtn = document.getElementById("mute-btn");
const progress = document.getElementById("radio-progress");
const progressContainer = document.getElementById("radio-progress-container");
const timeDisplay = document.getElementById("time-display");
const overlay = document.querySelector(".overlay");
const nowPlaying = document.getElementById("now-playing");

// ===============================
// CONFIG
// ===============================
const STREAM_URL = "https://stream.zeno.fm/ezq3fcuf5ehvv";
const RECONNECT_TIME = 4000;
const isMobile = window.innerWidth < 768;

// ===============================
// AUDIO SETUP
// ===============================
audio.src = STREAM_URL;
audio.preload = "none";
audio.crossOrigin = "anonymous";

let fadeInterval = null;
let reconnectTimeout = null;

// ===============================
// FADE AUDIO
// ===============================
function fadeIn() {
  clearInterval(fadeInterval);
  audio.volume = 0;
  fadeInterval = setInterval(() => {
    if (audio.volume < 0.95) {
      audio.volume += 0.05;
    } else {
      audio.volume = 1;
      clearInterval(fadeInterval);
    }
  }, 80);
}

function fadeOut(callback) {
  clearInterval(fadeInterval);
  fadeInterval = setInterval(() => {
    if (audio.volume > 0.05) {
      audio.volume -= 0.05;
    } else {
      audio.volume = 0;
      clearInterval(fadeInterval);
      if (callback) callback();
    }
  }, 60);
}

// ===============================
// CANVAS MATRIX
// ===============================
const canvas = document.getElementById("matrixCanvas");
const ctx = canvas.getContext("2d");
const fontSize = 16;
let columns = 0;
let drops = [];
let animationFrameId = null;
let animationRunning = false;
let matrixColor = "blue";

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
  "アァイィウヴエェオカガキギクグabcdefghijklmnopqrstuvwxyz0123456789".split(
    ""
  );

function drawMatrix() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = `${fontSize}px monospace`;

  for (let i = 0; i < drops.length; i++) {
    const text = chars[Math.floor(Math.random() * chars.length)];
    const x = i * fontSize;
    const y = drops[i] * fontSize;

    if (matrixColor === "live") {
      ctx.shadowColor = "rgba(255,60,60,1)";
      ctx.fillStyle = "rgba(255,80,80,1)";
    } else {
      ctx.shadowColor = "rgba(120,220,255,1)";
      ctx.fillStyle = "rgba(200,245,255,1)";
    }

    ctx.shadowBlur = 14;
    ctx.fillText(text, x, y);
    ctx.shadowBlur = 0;

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
// CONTROLES
// ===============================
playPauseBtn.addEventListener("click", async () => {
  try {
    nowPlaying.textContent = "CONECTANDO…";
    audio.muted = false;
    await audio.play();
    fadeIn();

    playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
    overlay.style.background = "rgba(0,0,0,0.25)";
    startMatrix();
  } catch (e) {
    console.warn("Autoplay bloqueado");
  }
});

stopBtn.addEventListener("click", () => {
  fadeOut(() => audio.pause());
  playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
  overlay.style.background = "transparent";
  stopMatrix();
  nowPlaying.textContent = "";
});

muteBtn.addEventListener("click", () => {
  audio.muted = !audio.muted;
  muteBtn.innerHTML = audio.muted
    ? '<i class="fas fa-volume-mute"></i>'
    : '<i class="fas fa-volume-up"></i>';
});

// ===============================
// STREAM EVENTS
// ===============================
audio.addEventListener("playing", () => {
  nowPlaying.textContent = "SONAR ROCK • EN EL AIRE";
  document.body.classList.add("playing");
});

audio.addEventListener("pause", () => {
  document.body.classList.remove("playing");
});

audio.addEventListener("stalled", reconnect);
audio.addEventListener("error", reconnect);

function reconnect() {
  nowPlaying.textContent = "RECONectando…";
  stopMatrix();
  clearTimeout(reconnectTimeout);
  reconnectTimeout = setTimeout(() => {
    audio.load();
    audio.play().catch(() => {});
  }, RECONNECT_TIME);
}

// ===============================
// LIVE STATUS ZENO
// ===============================
const liveIndicator = document.getElementById("live-indicator");
const liveText = liveIndicator.querySelector(".text");

async function checkLiveStatus() {
  try {
    const res = await fetch(
      "https://corsproxy.io/?https://api.zeno.fm/mounts/metadata/ezq3fcuf5ehvv"
    );
    const data = await res.json();
    const title = (data.streamTitle || "").toUpperCase();

    const isLive =
      title.includes("LIVE") ||
      title.includes("EN VIVO") ||
      title.includes("🔴");

    if (isLive) {
      liveIndicator.className = "live";
      liveText.textContent = "EN VIVO";
      matrixColor = "live";
    } else {
      liveIndicator.className = "auto";
      liveText.textContent = "PROGRAMACIÓN";
      matrixColor = "blue";
    }
  } catch {}
}

checkLiveStatus();
setInterval(checkLiveStatus, 20000);
