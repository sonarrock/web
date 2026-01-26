/* ===============================
   ELEMENTOS
=============================== */
const audio = document.getElementById("radio-audio");
const playPauseBtn = document.getElementById("playPauseBtn");
const stopBtn = document.getElementById("stop-btn");
const muteBtn = document.getElementById("mute-btn");
const volumeSlider = document.getElementById("volume");
const timeDisplay = document.getElementById("time-display");
const player = document.querySelector(".player-container");
const liveBadge = document.querySelector(".live-badge");

/* ===============================
   VALIDACIÓN
=============================== */
if (!audio || !playPauseBtn || !player) {
  console.error("❌ Reproductor incompleto");
}

/* ===============================
   ESTADO
=============================== */
let isPlaying = false;
let startTime = null;
let timerInterval = null;

/* ===============================
   PLAY / PAUSE
=============================== */
playPauseBtn.addEventListener("click", () => {
  if (!isPlaying) {
    audio.play()
      .then(() => {
        isPlaying = true;
        startTime = Date.now();
        playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
        player.classList.add("playing");
        player.style.setProperty("--glow-intensity", 0.75);
        liveBadge?.classList.add("active");
        startTimer();
      })
      .catch(err => {
        console.error("❌ Error al reproducir:", err);
      });
  } else {
    pauseRadio();
  }
});

/* ===============================
   PAUSA (INTERNA)
=============================== */
function pauseRadio() {
  audio.pause();
  isPlaying = false;
  playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
  player.style.setProperty("--glow-intensity", 0.35);
  stopTimer();
}

/* ===============================
   STOP
=============================== */
stopBtn?.addEventListener("click", () => {
  audio.pause();
  audio.currentTime = 0;
  isPlaying = false;
  playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
  player.classList.remove("playing");
  player.style.setProperty("--glow-intensity", 0.3);
  stopTimer();
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
   TIMER SIMULADO (STREAM)
=============================== */
function startTimer() {
  stopTimer();

  timerInterval = setInterval(() => {
    if (!startTime) return;

    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const hrs = String(Math.floor(elapsed / 3600)).padStart(2, "0");
    const mins = String(Math.floor((elapsed % 3600) / 60)).padStart(2, "0");
    const secs = String(elapsed % 60).padStart(2, "0");

    if (timeDisplay) {
      timeDisplay.textContent = `${hrs}:${mins}:${secs}`;
    }
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
  startTime = null;

  if (timeDisplay) {
    timeDisplay.textContent = "00:00:00";
  }
}

/* ===============================
   AUTO-RECOVERY (SI ZENO SE CAE)
=============================== */
audio.addEventListener("error", () => {
  console.warn("⚠️ Stream interrumpido. Reintentando...");
  pauseRadio();
  setTimeout(() => audio.play().catch(() => {}), 3000);
});
