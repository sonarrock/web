/* ===============================
   SONAR ROCK – PLAYER ESTABLE
=============================== */

document.addEventListener("DOMContentLoaded", () => {

  const audio = document.getElementById("radio-audio");
  const playBtn = document.getElementById("playPauseBtn");
  const stopBtn = document.getElementById("stop-btn");
  const muteBtn = document.getElementById("mute-btn");
  const volumeSlider = document.getElementById("volume");
  const liveIndicator = document.getElementById("live-indicator");
  const playerContainer = document.querySelector(".player-container");

  let isPlaying = false;

  if (!audio || !playBtn || !stopBtn || !muteBtn || !volumeSlider) {
    console.warn("Sonar Rock Player: elementos faltantes");
    return;
  }

  /* ===============================
     AUDIO CONFIG
  =============================== */
  audio.preload = "none";
  audio.volume = volumeSlider.value;

  /* ===============================
     PLAY / PAUSE
  =============================== */
  playBtn.addEventListener("click", () => {
    if (!isPlaying) {
      audio.play().then(() => {
        isPlaying = true;
        playBtn.innerHTML = '<i class="fas fa-pause"></i>';
        liveIndicator.textContent = "EN VIVO";
        playerContainer.classList.add("playing");
      }).catch(err => {
        console.error("Error al reproducir:", err);
      });
    } else {
      pauseStream();
    }
  });

  function pauseStream() {
    audio.pause();
    isPlaying = false;
    playBtn.innerHTML = '<i class="fas fa-play"></i>';
    liveIndicator.textContent = "PROGRAMACIÓN";
    playerContainer.classList.remove("playing");
  }

  /* ===============================
     STOP
  =============================== */
  stopBtn.addEventListener("click", pauseStream);

  /* ===============================
     MUTE
  =============================== */
  muteBtn.addEventListener("click", () => {
    audio.muted = !audio.muted;
    muteBtn.innerHTML = audio.muted
      ? '<i class="fas fa-volume-mute"></i>'
      : '<i class="fas fa-volume-up"></i>';
  });

  /* ===============================
     VOLUMEN
  =============================== */
  volumeSlider.addEventListener("input", () => {
    audio.volume = volumeSlider.value;
  });

  /* ===============================
     EVENTOS STREAM
  =============================== */
  audio.addEventListener("error", () => {
    console.warn("Stream no disponible");
    pauseStream();
  });

});
