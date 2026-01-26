/* ===============================
   ELEMENTOS
=============================== */
const audio = document.getElementById("radio-audio");
const playBtn = document.getElementById("playPauseBtn");
const stopBtn = document.getElementById("stop-btn");
const liveBadge = document.getElementById("live-indicator");
const player = document.querySelector(".player-container");
const matrixCanvas = document.getElementById("matrixCanvas");

if (!audio || !player) {
  console.error("❌ Player incompleto");
  throw new Error("Player incompleto");
}

const ctx = matrixCanvas.getContext("2d");

/* ===============================
   MATRIX CONFIG
=============================== */
const matrixChars = "SONARROCK101010";
const fontSize = 14;
let drops = [];
let animationId = null;

/* ===============================
   RESIZE
=============================== */
function resizeCanvas() {
  const rect = player.getBoundingClientRect();
  matrixCanvas.width = rect.width;
  matrixCanvas.height = rect.height;

  const cols = Math.floor(rect.width / fontSize);
  drops = Array(cols).fill(1);
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

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
    ctx.fillText(text, i * fontSize, y * fontSize);

    if (y * fontSize > matrixCanvas.height && Math.random() > 0.975) {
      drops[i] = 0;
    }
    drops[i]++;
  });
}

function animate() {
  if (audio.paused) return;
  drawMatrix();
  animationId = requestAnimationFrame(animate);
}

/* ===============================
   PLAY / PAUSE (CLAVE)
=============================== */
playBtn.addEventListener("click", () => {
  if (audio.paused) {
    liveBadge.classList.add("buffering");

    audio.load(); // 🔥 CLAVE PARA STREAMS
    audio.play().catch(err => {
      console.error("❌ Error play:", err);
    });
  } else {
    audio.pause();
  }
});

/* ===============================
   AUDIO EVENTS (MANDAN EL ESTADO)
=============================== */
audio.addEventListener("playing", () => {
  playBtn.innerHTML = '<i class="fas fa-pause"></i>';
  player.classList.add("playing");

  liveBadge.classList.remove("buffering");
  liveBadge.classList.add("active");

  animate();
});

audio.addEventListener("pause", () => {
  playBtn.innerHTML = '<i class="fas fa-play"></i>';
  player.classList.remove("playing");
  liveBadge.classList.remove("active");

  cancelAnimationFrame(animationId);
});

audio.addEventListener("waiting", () => {
  liveBadge.classList.add("buffering");
});

/* ===============================
   STOP
=============================== */
stopBtn.addEventListener("click", () => {
  audio.pause();
  audio.currentTime = 0;
});

/* ===============================
   RECOVERY ZENO
=============================== */
audio.addEventListener("error", () => {
  console.warn("⚠️ Stream cayó, reintentando…");
  setTimeout(() => audio.play().catch(() => {}), 3000);
});
