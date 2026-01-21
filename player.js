// ===============================
// SONAR ROCK PLAYER + MATRIX
// ===============================

const audio = document.getElementById("radio-audio");
const playPauseBtn = document.getElementById("playPauseBtn");
const stopBtn = document.getElementById("stop-btn");
const muteBtn = document.getElementById("mute-btn");
const progress = document.getElementById("radio-progress");
const progressContainer = document.getElementById("radio-progress-container");
const timeDisplay = document.getElementById("time-display");

// --------------------
// CANVAS MATRIX
// --------------------
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

// --------------------
// MATRIX AZUL / PLATA
// --------------------
const chars =
  "アァイィウヴエェオカガキギクグabcdefghijklmnopqrstuvwxyz0123456789".split(
    ""
  );

function drawMatrix() {
  ctx.fillStyle = "rgba(0,0,0,0.05)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.font = `${fontSize}px monospace`;

  for (let i = 0; i < drops.length; i++) {
    const text = chars[Math.floor(Math.random() * chars.length)];
    const x = i * fontSize;
    const y = drops[i] * fontSize;

    ctx.fillStyle = "rgba(150,220,255,1)";
    ctx.fillText(text, x, y);

    if (y > canvas.height && Math.random() > 0.975) {
      drops[i] = 0;
    }
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
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// --------------------
// CONTROLES
// --------------------
playPauseBtn.addEventListener("click", async () => {
  try {
    audio.muted = false;
    audio.volume = 1;
    await audio.play();

    playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
    document.querySelector(".overlay").style.background =
      "rgba(0,0,0,0.05)";
    startMatrix();
  } catch (err) {
    console.error("Error al reproducir el stream:", err);
    alert("Da clic nuevamente para activar el audio");
  }
});

stopBtn.addEventListener("click", () => {
  audio.pause();
  playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
  document.querySelector(".overlay").style.background = "transparent";
  stopMatrix();
});

muteBtn.addEventListener("click", () => {
  audio.muted = !audio.muted;
  muteBtn.innerHTML = audio.muted
    ? '<i class="fas fa-volume-mute"></i>'
    : '<i class="fas fa-volume-up"></i>';
});

// --------------------
// TIEMPO (STREAM)
// --------------------
audio.addEventListener("timeupdate", () => {
  if (isFinite(audio.currentTime)) {
    const mins = Math.floor(audio.currentTime / 60);
    const secs = Math.floor(audio.currentTime % 60);
    timeDisplay.textContent = `${mins
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
});

audio.addEventListener("error", () => {
  console.warn("Stream caído, intentando reconectar...");
  stopMatrix();
  playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
});

audio.addEventListener("stalled", () => {
  audio.load();
});

// --------------------
// ESTADO VISUAL PLAY / PAUSE
// --------------------
audio.addEventListener("play", () => {
  document.body.classList.add("playing");
});

audio.addEventListener("pause", () => {
  document.body.classList.remove("playing");
});

// ===============================
// LIVE STATUS DESDE METADATA ZENO
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
      title.includes("EN VIVO") ||
      title.includes("🔴");

    if (isLive) {
      liveIndicator.classList.remove("auto");
      liveIndicator.classList.add("live");
      liveText.textContent = "EN VIVO";
    } else {
      liveIndicator.classList.remove("live");
      liveIndicator.classList.add("auto");
      liveText.textContent = "PROGRAMACIÓN";
    }
  } catch (err) {
    console.warn("No se pudo verificar estado LIVE:", err);
  }
}

// Revisar cada 20 segundos
checkLiveStatus();
setInterval(checkLiveStatus, 20000);
