const audio = document.getElementById("radio-audio");
const playerContainer = document.getElementById("player"); // Referencia al contenedor principal
const playPauseBtn = document.getElementById("playPauseBtn");
const stopBtn = document.getElementById("stop-btn");
const muteBtn = document.getElementById("mute-btn");
const volumeSlider = document.getElementById("volume");
const progressBar = document.getElementById("radio-progress"); // ID corregido
const timeDisplayEl = document.getElementById("time-display"); // ID corregido
const liveIndicatorEl = document.getElementById("live-indicator"); // ID corregido
const nowPlayingEl = document.getElementById("now-playing"); // Para mostrar info de la canción

let fakeSeconds = 0;
let fakeTimer = null;

// Inicializa el indicador en "OFFLINE"
liveIndicatorEl.style.display = "none";
nowPlayingEl.textContent = "Sonar Rock - La Radio Independiente";

/* ===============================
   PLAY / PAUSE
=============================== */
playPauseBtn.addEventListener("click", () => {
  if (audio.paused) {
    audio.play();
    playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>'; // Cambia el ícono a pausa
    liveIndicatorEl.style.display = "flex"; // Muestra el indicador EN VIVO
    playerContainer.classList.add("is-playing"); // Añade clase para ocultar overlay/añadir sombra
    startFakeTimer();
    nowPlayingEl.textContent = "¡Estás escuchando la transmisión en vivo!";
  } else {
    audio.pause();
    playPauseBtn.innerHTML = '<i class="fas fa-play"></i>'; // Cambia el ícono a play
    stopFakeTimer();
    nowPlayingEl.textContent = "Transmisión Pausada";
  }
});

/* ===============================
   STOP
=============================== */
stopBtn.addEventListener("click", () => {
  audio.pause();
  audio.currentTime = 0;
  fakeSeconds = 0;
  updateFakeUI();
  playPauseBtn.innerHTML = '<i class="fas fa-play"></i>'; // Cambia el ícono a play
  liveIndicatorEl.style.display = "none"; // Oculta el indicador EN VIVO
  playerContainer.classList.remove("is-playing"); // Remueve la clase is-playing
  stopFakeTimer();
  nowPlayingEl.textContent = "OFFLINE";
});

/* ===============================
   MUTE / UNMUTE
=============================== */
muteBtn.addEventListener("click", () => {
  audio.muted = !audio.muted;
  // Actualiza el ícono de mute
  muteBtn.innerHTML = audio.muted 
    ? '<i class="fas fa-volume-mute"></i>' 
    : '<i class="fas fa-volume-up"></i>';
});

/* ===============================
   VOLUME SLIDER
=============================== */
volumeSlider.addEventListener("input", e => {
  audio.volume = e.target.value;
  // Si el usuario ajusta el volumen, nos aseguramos de que no esté silenciado visualmente.
  if (audio.volume > 0) {
      audio.muted = false;
      muteBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
  }
});

/* ===============================
   FAKE STREAM TIME
=============================== */
function startFakeTimer() {
  if (fakeTimer) return;
  fakeTimer = setInterval(() => {
    fakeSeconds++;
    updateFakeUI();
  }, 1000);
}

function stopFakeTimer() {
  clearInterval(fakeTimer);
  fakeTimer = null;
}

function updateFakeUI() {
  // Formatea los segundos a MM:SS o HH:MM:SS
  const formatTime = (secs) => {
    const hours = Math.floor(secs / 3600);
    const minutes = Math.floor((secs % 3600) / 60);
    const seconds = Math.floor(secs % 60);
    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    }
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  };

  timeDisplayEl.textContent = formatTime(fakeSeconds);
  
  // Como es un stream en vivo, la barra de progreso solo se llena y reinicia
  progressBar.style.width = `${(fakeSeconds % 60) * 1.666}%`; // Se llena en 60 segundos
  if (fakeSeconds % 60 === 0) {
    progressBar.style.width = `0%`;
  }
}
