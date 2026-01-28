const audio = document.getElementById("radio-audio");
const playerContainer = document.getElementById("player"); 
const playPauseBtn = document.getElementById("playPauseBtn");
const stopBtn = document.getElementById("stop-btn");
const muteBtn = document.getElementById("mute-btn");
const volumeSlider = document.getElementById("volume");
const liveIndicatorEl = document.getElementById("live-indicator"); 
const nowPlayingEl = document.getElementById("now-playing");

// liveIndicatorEl.style.display = "none"; // Ocultar por defecto si no está sonando
nowPlayingEl.textContent = "Sonar Rock - La Radio Independiente";

/* ===============================
   PLAY / PAUSE
=============================== */
playPauseBtn.addEventListener("click", () => {
  if (audio.paused) {
    audio.play();
    playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>'; 
    liveIndicatorEl.style.display = "flex"; 
    playerContainer.classList.add("is-playing");
    nowPlayingEl.textContent = "¡Estás escuchando la transmisión en vivo!";
  } else {
    audio.pause();
    playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
    playerContainer.classList.remove("is-playing");
    nowPlayingEl.textContent = "Transmisión Pausada";
  }
});

/* ===============================
   STOP
=============================== */
stopBtn.addEventListener("click", () => {
  audio.pause();
  audio.currentTime = 0;
  playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
  liveIndicatorEl.style.display = "none";
  playerContainer.classList.remove("is-playing");
  nowPlayingEl.textContent = "OFFLINE";
});

/* ===============================
   MUTE / UNMUTE / VOLUME
=============================== */
muteBtn.addEventListener("click", () => {
  audio.muted = !audio.muted;
  muteBtn.innerHTML = audio.muted 
    ? '<i class="fas fa-volume-mute"></i>' 
    : '<i class="fas fa-volume-up"></i>';
});

volumeSlider.addEventListener("input", e => {
  audio.volume = e.target.value;
  if (audio.volume > 0) {
      audio.muted = false;
      muteBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
  }
});
