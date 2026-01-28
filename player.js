/* ===============================
   ELEMENTOS
=============================== */
const audio = document.getElementById("radio-audio");
const playBtn = document.getElementById("playPauseBtn");
const stopBtn = document.getElementById("stop-btn");
const muteBtn = document.getElementById("mute-btn");
const volumeSlider = document.getElementById("volume");
const liveBadge = document.getElementById("live-indicator");
const player = document.querySelector(".player-container");
const matrixCanvas = document.getElementById("matrixCanvas");

if (!audio || !playBtn || !player || !matrixCanvas || !liveBadge) {
  console.error("❌ Player incompleto");
}

/* ===============================
   ESTADO
=============================== */
let isPlaying = false;
let fadeInterval = null;

/* ===============================
   LIVE / BUFFERING INDICATOR
=============================== */
function setLive() {
  liveBadge.classList.remove("buffering");
  liveBadge.classList.add("active");
  liveBadge.querySelector(".text").textContent = "EN VIVO";
}

function setBuffering() {
  liveBadge.classList.remove("active");
  liveBadge.classList.add("buffering");
  liveBadge.querySelector(".text").textContent = "CONECTANDO…";
}

function setOffline() {
  liveBadge.classList.remove("active", "buffering");
  liveBadge.querySelector(".text").textContent = "OFFLINE";
}

/* ===============================
   FADE IN / FADE OUT
=============================== */
function fadeTo(targetVolume, duration = 2000) {
  clearInterval(fadeInterval);

  const startVolume = audio.volume;
  const steps = 30;
  const stepTime = duration / steps;
  const volumeStep = (targetVolume - startVolume) / steps;

  let currentStep = 0;

  fadeInterval = setInterval(() => {
    currentStep++;
    audio.volume = Math.min(1, Math.max(0, audio.volume + volumeStep));

    if (currentStep >= steps) {
      audio.volume = targetVolume;
      clearInterval(fadeInterval);
    }
  }, stepTime);
}

/* ===============================
   MATRIX EFFECT
=============================== */
const matrixCtx = matrixCanvas.getContext("2d");
const matrixChars = "0123456789ABCDEFGHIJKMNOPQRSTUVXYZ";
const fontSize = 14;
let drops = [];
let animationId = null;

function resizeCanvas() {
  const rect = player.getBoundingClientRect();
  matrixCanvas.width = rect.width;
  matrixCanvas.height = rect.height;
  const columns = Math.floor(rect.width / fontSize);
  drops = Array(columns).fill(1);
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);
window.addEventListener("orientationchange", resizeCanvas);

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
  resizeCanvas();
  showMatrix();

  cancelAnimationFrame(animationId);
  animationId = requestAnimationFrame(function animate() {
    drawMatrix();
    animationId = requestAnimationFrame(animate);
  });
}

function stopMatrix() {
  cancelAnimationFrame(animationId);
  animationId = null;
  hideMatrix();
}

function hideMatrix() {
  matrixCtx.clearRect(0, 0, matrixCanvas.width, matrixCanvas.height);
  matrixCanvas.style.opacity = "0";
}

function showMatrix() {
  matrixCanvas.style.opacity = "1";
}

/* ===============================
   PLAY / PAUSE
=============================== */
playBtn.addEventListener("click", async () => {
  if (!isPlaying) {
    setBuffering();

    try {
      audio.volume = 0;
      await audio.play();

      const targetVolume = volumeSlider ? volumeSlider.value / 100 : 0.8;

      isPlaying = true;
      playBtn.innerHTML = '<i class="fas fa-pause"></i>';
      player.classList.add("playing");

      fadeTo(targetVolume, 2000);
      startMatrix();

    } catch (err) {
      console.error("❌ Error al reproducir:", err);
      setOffline();
    }

  } else {
    fadeTo(0, 800);
    setTimeout(() => audio.pause(), 800);

    isPlaying = false;
    playBtn.innerHTML = '<i class="fas fa-play"></i>';
    player.classList.remove("playing");

    stopMatrix();
    setOffline();
  }
});

/* ===============================
   STOP (STREAM SAFE)
=============================== */
stopBtn.addEventListener("click", () => {
  fadeTo(0, 800);

  setTimeout(() => {
    audio.pause();
  }, 800);

  isPlaying = false;
  playBtn.innerHTML = '<i class="fas fa-play"></i>';
  player.classList.remove("playing");

  stopMatrix();
  setOffline();
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
   VOLUMEN (NORMALIZADO)
=============================== */
if (volumeSlider) {
  audio.volume = volumeSlider.value / 100;

  volumeSlider.addEventListener("input", () => {
    audio.volume = volumeSlider.value / 100;
  });
}

/* ===============================
   STREAM REAL EVENTS
=============================== */
audio.addEventListener("playing", setLive);
audio.addEventListener("waiting", setBuffering);
audio.addEventListener("stalled", setBuffering);
audio.addEventListener("error", setOffline);

audio.addEventListener("pause", () => {
  if (!isPlaying) setOffline();
});

/* ===============================
   AUTO RECOVERY STREAM
=============================== */
let retryCount = 0;
let retryTimer = null;
const maxRetries = 10;

function reconnectStream() {
  if (!isPlaying || retryCount >= maxRetries) return;

  retryCount++;
  setBuffering();
  clearTimeout(retryTimer);

  try {
    audio.pause();
    audio.src = audio.src.split("?")[0] + "?t=" + Date.now();
    audio.load();
    audio.play().catch(() => {});
  } catch (e) {}

  retryTimer = setTimeout(
    reconnectStream,
    Math.min(3000 * retryCount, 15000)
  );
}

audio.addEventListener("playing", () => {
  retryCount = 0;
  clearTimeout(retryTimer);
});

setInterval(() => {
  if (isPlaying && !audio.paused && audio.readyState < 3) {
    reconnectStream();
  }
}, 10000);

window.addEventListener("online", reconnectStream);

document.addEventListener("visibilitychange", () => {
  if (!document.hidden && isPlaying) {
    audio.play().catch(() => {});
  }
});

/* ===============================
   INIT
=============================== */
hideMatrix();
setOffline();

/* ===============================
   SERVICE WORKER
=============================== */
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/service-worker.js")
      .then(() => console.log("✅ Service Worker registrado"))
      .catch(err => console.warn("❌ SW error:", err));
  });
}
