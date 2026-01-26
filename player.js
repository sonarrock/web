/* ===============================
   ELEMENTOS
=============================== */
const audio = document.getElementById("radio-audio");
const playBtn = document.getElementById("playPauseBtn");
const stopBtn = document.getElementById("stop-btn");
const liveBadge = document.getElementById("live-indicator");
const player = document.querySelector(".player-container");
const matrixCanvas = document.getElementById("matrixCanvas");

if (!audio || !playBtn || !player || !matrixCanvas) {
  console.error("❌ Elementos del reproductor incompletos");
  throw new Error("Player incompleto");
}

const matrixCtx = matrixCanvas.getContext("2d");

/* ===============================
   ESTADO
=============================== */
let audioCtx = null;
let analyser = null;
let source = null;
let animationId = null;
let isPlaying = false;

/* ===============================
   MATRIX CONFIG
=============================== */
const matrixChars = "SONARROCK101010";
const fontSize = 14;
let matrixDrops = [];

/* ===============================
   RESIZE MATRIX
=============================== */
function resizeCanvas() {
  const rect = player.getBoundingClientRect();
  matrixCanvas.width = rect.width;
  matrixCanvas.height = rect.height;

  const columns = Math.floor(rect.width / fontSize);
  matrixDrops = Array(columns).fill(1);
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);
window.addEventListener("orientationchange", resizeCanvas);

/* ===============================
   AUDIO CONTEXT (CHROME SAFE)
=============================== */
function initAudioContext() {
  if (audioCtx) return;

  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  analyser = audioCtx.createAnalyser();
  analyser.fftSize = 256;

  source = audioCtx.createMediaElementSource(audio);
  source.connect(analyser);
  analyser.connect(audioCtx.destination);
}

/* ===============================
   MATRIX DRAW
=============================== */
function drawMatrix() {
  matrixCtx.fillStyle = "rgba(0, 0, 0, 0.06)";
  matrixCtx.fillRect(0, 0, matrixCanvas.width, matrixCanvas.height);

  matrixCtx.fillStyle = "#ff6600";
  matrixCtx.font = `${fontSize}px monospace`;

  matrixDrops.forEach((y, i) => {
    const x = i * fontSize;
    const text =
      matrixChars[Math.floor(Math.random() * matrixChars.length)];

    matrixCtx.fillText(text, x, y * fontSize);

    if (y * fontSize > matrixCanvas.height && Math.random() > 0.975) {
      matrixDrops[i] = 0;
    }

    matrixDrops[i]++;
  });
}

/* ===============================
   ANIMATION LOOP
=============================== */
function animate() {
  if (!isPlaying) return;
  drawMatrix();
  animationId = requestAnimationFrame(animate);
}

/* ===============================
   PLAY / PAUSE
=============================== */
playBtn.addEventListener("click", async () => {
  initAudioContext();

  if (audioCtx.state === "suspended") {
    await audioCtx.resume();
  }

  if (!isPlaying) {
    liveBadge?.classList.add("buffering");
    liveBadge?.classList.remove("active");

    audio
      .play()
      .then(() => {
        isPlaying = true;

        playBtn.innerHTML = '<i class="fas fa-pause"></i>';
        player.classList.add("playing");

        liveBadge?.classList.remove("buffering");
        liveBadge?.classList.add("active");

        animate();
      })
      .catch((err) => {
        console.error("❌ Error al reproducir:", err);
        liveBadge?.classList.remove("buffering");
      });
  } else {
    audio.pause();
    isPlaying = false;

    playBtn.innerHTML = '<i class="fas fa-play"></i>';
    player.classList.remove("playing");
    liveBadge?.classList.remove("active");

    cancelAnimationFrame(animationId);
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
  liveBadge?.classList.remove("active");
  liveBadge?.classList.remove("buffering");

  cancelAnimationFrame(animationId);
});

/* ===============================
   AUTO-RECOVERY (ZENO)
=============================== */
audio.addEventListener("error", () => {
  console.warn("⚠️ Stream interrumpido. Reintentando…");

  if (!isPlaying) return;

  setTimeout(() => {
    audio.play().catch(() => {});
  }, 3000);
});
