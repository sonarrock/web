/* ===============================
   ELEMENTOS
=============================== */
const audio = document.getElementById("radio-audio");
const playBtn = document.getElementById("playPauseBtn");
const stopBtn = document.getElementById("stop-btn");
const liveBadge = document.getElementById("live-indicator");
const player = document.querySelector(".player-container");
const matrixCanvas = document.getElementById("matrixCanvas");

if (!audio || !player || !matrixCanvas) {
  console.error("❌ Elementos del reproductor faltantes");
  throw new Error("Player incompleto");
}

const ctx = matrixCanvas.getContext("2d");

/* ===============================
   ESTADO
=============================== */
let isPlaying = false;
let animationId = null;

/* ===============================
   MATRIX CONFIG
=============================== */
const matrixChars = "SONARROCK101010";
const fontSize = 14;
let drops = [];

/* ===============================
   RESIZE CANVAS
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
  ctx.fillStyle = "rgba(0,0,0,0.06)";
  ctx.fillRect(0, 0, matrixCanvas.width, matrixCanvas.height);

  ctx.fillStyle = "#ff6600";
  ctx.font = `${fontSize}px monospace`;

  drops.forEach((y, i) => {
    const text = matrixChars[Math.floor(Math.random() * matrixChars.length)];
    const x = i * fontSize;

    ctx.fillText(text, x, y * fontSize);

    if (y * fontSize > matrixCanvas.height && Math.random() > 0.975) {
      drops[i] = 0;
    }
    drops[i]++;
  });
}

/* ===============================
   LOOP
=============================== */
function animate() {
  if (!isPlaying) return;
  drawMatrix();
  animationId = requestAnimationFrame(animate);
}

/* ===============================
   PLAY / PAUSE
=============================== */
playBtn.addEventListener("click", () => {
  if (!isPlaying) {
    liveBadge?.classList.add("buffering");

    audio.play()
      .then(() => {
        isPlaying = true;
        playBtn.innerHTML = '<i class="fas fa-pause"></i>';

        player.classList.add("playing");
        liveBadge?.classList.remove("buffering");
        liveBadge?.classList.add("active");

        animate();
      })
      .catch(err => {
        console.error("❌ No se pudo reproducir:", err);
        liveBadge?.classList.remove("buffering");
      });

  } else {
    audio.pause();
  }
});

/* ===============================
   AUDIO EVENTS (LA CLAVE)
=============================== */
audio.addEventListener("pause", () => {
  isPlaying = false;
  playBtn.innerHTML = '<i class="fas fa-play"></i>';
  player.classList.remove("playing");
  liveBadge?.classList.remove("active");

  cancelAnimationFrame(animationId);
});

audio.addEventListener("playing", () => {
  liveBadge?.classList.remove("buffering");
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
  liveBadge?.classList.remove("active");

  cancelAnimationFrame(animationId);
});

/* ===============================
   AUTO-RECOVERY ZENO
=============================== */
audio.addEventListener("error", () => {
  console.warn("⚠️ Stream interrumpido, reintentando…");
  setTimeout(() => audio.play().catch(() => {}), 3000);
});
