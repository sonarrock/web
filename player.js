/* ===============================
   ELEMENTOS
=============================== */
const audio = document.getElementById("radio-audio");
const playBtn = document.getElementById("playPauseBtn");
const stopBtn = document.getElementById("stop-btn");
const muteBtn = document.getElementById("mute-btn");
const liveBadge = document.getElementById("live-indicator");
const player = document.querySelector(".player-container");
const matrixCanvas = document.getElementById("matrixCanvas");
const volumeSlider = document.getElementById("volume");

if (!audio || !playBtn || !player || !matrixCanvas) {
  console.error("❌ Player incompleto");
}

/* ===============================
   ESTADO
=============================== */
let isPlaying = false;
let fadeInterval = null;
let animationId = null;

/* ===============================
   MATRIX CONFIG
=============================== */
const matrixCtx = matrixCanvas.getContext("2d");
const matrixChars = "0123456789SONARROCK";
const fontSize = 14;
let drops = [];

/* ===============================
   CANVAS RESIZE
=============================== */
function resizeCanvas() {
  const rect = player.getBoundingClientRect();
  matrixCanvas.width = rect.width;
  matrixCanvas.height = rect.height;
  drops = Array(Math.floor(rect.width / fontSize)).fill(1);
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);
window.addEventListener("orientationchange", resizeCanvas);

/* ===============================
   MATRIX DRAW
=============================== */
function drawMatrix() {
  matrixCtx.fillStyle = "rgba(0,0,0,0.08)";
  matrixCtx.fillRect(0, 0, matrixCanvas.width, matrixCanvas.height);

  matrixCtx.fillStyle = "#ff6600";
  matrixCtx.font = `${fontSize}px monospace`;

  drops.forEach((y, i) => {
    const x = i * fontSize;
    const char = matrixChars[Math.floor(Math.random() * matrixChars.length)];
    matrixCtx.fillText(char, x, y * fontSize);

    if (y * fontSize > matrixCanvas.height && Math.random() > 0.975) {
      drops[i] = 0;
    }
    drops[i]++;
  });
}

function startMatrix() {
  matrixCanvas.classList.add("active");
  cancelAnimationFrame(animationId);
  (function animate() {
    drawMatrix();
    animationId = requestAnimationFrame(animate);
  })();
}

function stopMatrix() {
  matrixCanvas.classList.remove("active");
  cancelAnimationFrame(animationId);
  animationId = null;
}

/* ===============================
   FADE IN / FADE OUT
=============================== */
function fadeTo(target, duration = 2000) {
  clearInterval(fadeInterval);

  const steps = 30;
  const stepTime = duration / steps;
  const start = audio.volume;
  const diff = (target - start) / steps;
  let count = 0;

  fadeInterval = setInterval(() => {
    count++;
    audio.volume = Math.min(1, Math.max(0, audio.volume + diff));
    if (count >= steps) {
      audio.volume = target;
      clearInterval(fadeInterval);
    }
  }, stepTime);
}

/* ===============================
   PLAY / PAUSE
=============================== */
playBtn.addEventListener("click", async () => {
  if (!isPlaying) {
    liveBadge.classList.add("buffering");
    liveBadge.classList.remove("active");

    try {
      audio.volume = 0;
      await audio.play();
      fadeTo(volumeSlider ? volumeSlider.value : 1, 2500);

      isPlaying = true;
      playBtn.innerHTML = '<i class="fas fa-pause"></i>';
      player.classList.add("playing");
      liveBadge.classList.remove("buffering");
      liveBadge.classList.add("active");

      startMatrix();
    } catch (e) {
      liveBadge.classList.remove("buffering");
      console.error("❌ Play error", e);
    }
  } else {
    fadeTo(0, 1200);
    setTimeout(() => audio.pause(), 1300);

    isPlaying = false;
    playBtn.innerHTML = '<i class="fas fa-play"></i>';
    player.classList.remove("playing");
    liveBadge.classList.remove("active");

    stopMatrix();
  }
});

/* ===============================
   STOP
=============================== */
stopBtn.addEventListener("click", () => {
  fadeTo(0, 1000);
  setTimeout(() => {
    audio.pause();
    audio.currentTime = 0;
  }, 1100);

  isPlaying = false;
  playBtn.innerHTML = '<i class="fas fa-play"></i>';
  player.classList.remove("playing");
  liveBadge.classList.remove("active");

  stopMatrix();
});

/* ===============================
   MUTE
=============================== */
muteBtn?.addEventListener("click", () => {
  audio.muted = !audio.muted;
  muteBtn.innerHTML = audio.muted
    ? '<i class="fas fa-volume-mute"></i>'
    : '<i class="fas fa-volume-up"></i>';
});

/* ===============================
   VOLUMEN
=============================== */
if (volumeSlider) {
  audio.volume = volumeSlider.value;
  volumeSlider.addEventListener("input", () => {
    audio.volume = volumeSlider.value;
  });
}

/* ===============================
   AUTO RECOVERY STREAM
=============================== */
let retryCount = 0;
let retryTimer = null;

function reconnectStream() {
  if (retryCount > 8) return;
  retryCount++;

  fadeTo(0, 800);

  clearTimeout(retryTimer);
  retryTimer = setTimeout(() => {
    audio.pause();
    audio.load();
    audio.play().then(() => {
      fadeTo(volumeSlider ? volumeSlider.value : 1, 2000);
    }).catch(() => {});
  }, 2000);
}

audio.addEventListener("playing", () => {
  retryCount = 0;
});

audio.addEventListener("error", reconnectStream);
audio.addEventListener("stalled", reconnectStream);

setInterval(() => {
  if (!audio.paused && audio.readyState < 3) reconnectStream();
}, 10000);

window.addEventListener("online", reconnectStream);

/* ===============================
   SERVICE WORKER
=============================== */
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/service-worker.js")
      .catch(() => {});
  });
}
