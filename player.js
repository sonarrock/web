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
let matrixCtx = matrixCanvas.getContext("2d");
let animationId = null;

/* ===============================
   MATRIX CONFIG
=============================== */
const matrixChars = "0123456789ABCDEFGHIJKMNOPQRSTUVXYZ";
const fontSize = 14;
let drops = [];

/* ===============================
   CANVAS RESIZE
=============================== */
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

function animateMatrix() {
  drawMatrix();
  animationId = requestAnimationFrame(animateMatrix);
}

/* ===============================
   MATRIX CONTROL
=============================== */
function startMatrix() {
  matrixCanvas.classList.add("active");
  cancelAnimationFrame(animationId);
  animateMatrix();
}

function stopMatrix() {
  matrixCanvas.classList.remove("active");
  cancelAnimationFrame(animationId);
  animationId = null;
}

/* ===============================
   PLAY / PAUSE
=============================== */
playBtn.addEventListener("click", async () => {

  if (!isPlaying) {
    liveBadge.classList.add("buffering");
    liveBadge.classList.remove("active");

    try {
      await audio.play();

      isPlaying = true;
      playBtn.innerHTML = '<i class="fas fa-pause"></i>';
      player.classList.add("playing");

      liveBadge.classList.remove("buffering");
      liveBadge.classList.add("active");

      startMatrix();

    } catch (err) {
      console.error("❌ Error al reproducir:", err);
      liveBadge.classList.remove("buffering");
    }

  } else {
    audio.pause();
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
  audio.pause();
  audio.currentTime = 0;
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
   AUTO RECOVERY (ZENO)
=============================== */
audio.addEventListener("error", () => {
  console.warn("⚠️ Stream interrumpido. Reintentando...");

  if (liveBadge) {
    liveBadge.classList.add("buffering");
    liveBadge.classList.remove("active");
  }

  setTimeout(() => {
    audio.play().catch(() => {});
  }, 3000);
});

/* ===============================
   CONTROL DE VOLUMEN
=============================== */
const volumeSlider = document.getElementById("volume");

if (volumeSlider) {
  audio.volume = volumeSlider.value;

  volumeSlider.addEventListener("input", () => {
    audio.volume = volumeSlider.value;
  });
}
