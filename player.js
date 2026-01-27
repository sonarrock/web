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
   STATUS (MANUAL / UX HONESTO)
=============================== */
function setLive() {
  liveBadge.classList.remove("buffering");
  liveBadge.classList.add("active");
  liveBadge.querySelector(".text").textContent = "SONANDO";
}

function setBuffering() {
  liveBadge.classList.remove("active");
  liveBadge.classList.add("buffering");
  liveBadge.querySelector(".text").textContent = "CONECTANDO…";
}

function setOffline() {
  liveBadge.classList.remove("active", "buffering");
  liveBadge.querySelector(".text").textContent = "PROGRAMACIÓN";
}

/* ===============================
   FADE IN / FADE OUT
=============================== */
function fadeTo(targetVolume, duration = 1500) {
  clearInterval(fadeInterval);

  const startVolume = audio.volume;
  const steps = 25;
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
const ctx = matrixCanvas.getContext("2d");
const chars = "0123456789ABCDEFGHIJKMNOPQRSTUVXYZ";
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

function drawMatrix() {
  ctx.fillStyle = "rgba(0,0,0,0.08)";
  ctx.fillRect(0, 0, matrixCanvas.width, matrixCanvas.height);

  ctx.fillStyle = "#ff6600";
  ctx.font = `${fontSize}px monospace`;

  drops.forEach((y, i) => {
    const x = i * fontSize;
    const char = chars[Math.floor(Math.random() * chars.length)];
    ctx.fillText(char, x, y * fontSize);

    if (y * fontSize > matrixCanvas.height && Math.random() > 0.975) {
      drops[i] = 0;
    }
    drops[i]++;
  });
}

function startMatrix() {
  resizeCanvas();
  cancelAnimationFrame(animationId);
  animationId = requestAnimationFrame(function animate() {
    drawMatrix();
    animationId = requestAnimationFrame(animate);
  });
}

function stopMatrix() {
  cancelAnimationFrame(animationId);
  animationId = null;
  ctx.clearRect(0, 0, matrixCanvas.width, matrixCanvas.height);
}

/* ===============================
   PLAY / PAUSE
=============================== */
playBtn.addEventListener("click", async () => {
  if (!isPlaying) {
    setBuffering();

    try {
      audio.volume = volumeSlider ? volumeSlider.value : 0.8;
      await audio.play();

      isPlaying = true;
      playBtn.innerHTML = '<i class="fas fa-pause"></i>';
      player.classList.add("playing");

      setLive();          // 🔥 SONANDO
      fadeTo(audio.volume);
      startMatrix();

    } catch (err) {
      console.error("❌ Error al reproducir:", err);
      setOffline();
    }

  } else {
    fadeTo(0, 600);
    setTimeout(() => audio.pause(), 600);

    isPlaying = false;
    playBtn.innerHTML = '<i class="fas fa-play"></i>';
    player.classList.remove("playing");

    stopMatrix();
    setOffline();        // 🔕 PROGRAMACIÓN
  }
});

const progressBar = document.getElementById("progressBar");
const timeDisplay = document.getElementById("timeDisplay");

let playStartTime = null;
let timerInterval = null;

// Cuando se da PLAY
function startTimer() {
  playStartTime = Date.now();

  timerInterval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - playStartTime) / 1000);

    const min = String(Math.floor(elapsed / 60)).padStart(2, "0");
    const sec = String(elapsed % 60).padStart(2, "0");

    timeDisplay.textContent = `${min}:${sec}`;

    // Barra simulando progreso por minuto
    const progress = (elapsed % 60) / 60 * 100;
    progressBar.style.width = `${progress}%`;
  }, 1000);
}

// Cuando se pausa o detiene
function stopTimer() {
  clearInterval(timerInterval);
  progressBar.style.width = "0%";
  timeDisplay.textContent = "00:00";
}


/* ===============================
   STOP
=============================== */
stopBtn?.addEventListener("click", () => {
  fadeTo(0, 600);

  setTimeout(() => {
    audio.pause();
    audio.currentTime = 0;
  }, 600);

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
   VOLUMEN
=============================== */
if (volumeSlider) {
  audio.volume = volumeSlider.value;
  volumeSlider.addEventListener("input", () => {
    audio.volume = volumeSlider.value;
  });
}

/* ===============================
   EVENTOS REALES (SIN ZENO FAKE)
=============================== */
audio.addEventListener("waiting", setBuffering);
audio.addEventListener("stalled", setBuffering);
audio.addEventListener("error", setOffline);

/* ===============================
   RECOVERY BÁSICO
=============================== */
window.addEventListener("online", () => {
  if (isPlaying) audio.play().catch(() => {});
});

document.addEventListener("visibilitychange", () => {
  if (!document.hidden && isPlaying) {
    audio.play().catch(() => {});
  }
});

/* ===============================
   INIT
=============================== */
resizeCanvas();
window.addEventListener("resize", resizeCanvas);
setOffline();

