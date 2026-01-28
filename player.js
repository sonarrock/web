document.addEventListener("DOMContentLoaded", () => {

  const audio = document.getElementById("radio-audio");
  const playBtn = document.getElementById("playPauseBtn");
  const stopBtn = document.getElementById("stop-btn");
  const muteBtn = document.getElementById("mute-btn");
  const volumeSlider = document.getElementById("volume");
  const liveIndicator = document.getElementById("live-indicator");
  const playerContainer = document.querySelector(".player-container");

  let isPlaying = false;

  /* =============================== */
  /* REPRODUCCIÓN Y CONTROL DE AUDIO */
  /* =============================== */

  // Reproducir audio
  playBtn.addEventListener("click", () => {
    if (!isPlaying) {
      audio.play().then(() => {
        isPlaying = true;
        playBtn.innerHTML = '<i class="fas fa-pause"></i>';
        liveIndicator.textContent = "EN VIVO";
        liveIndicator.classList.add("active");
        playerContainer.classList.add("playing");

        startMatrix();  // Inicia animación de Matrix al reproducir
      }).catch(err => {
        console.error("Error al reproducir:", err);
      });
    } else {
      audio.pause();
      isPlaying = false;
      playBtn.innerHTML = '<i class="fas fa-play"></i>';
      liveIndicator.textContent = "OFFLINE";
      liveIndicator.classList.remove("active");
      playerContainer.classList.remove("playing");

      stopMatrix();  // Detiene animación de Matrix al pausar
    }
  });

  // Detener audio
  stopBtn.addEventListener("click", () => {
    audio.pause();
    audio.currentTime = 0;
    isPlaying = false;
    playBtn.innerHTML = '<i class="fas fa-play"></i>';
    liveIndicator.textContent = "OFFLINE";
    liveIndicator.classList.remove("active");
    playerContainer.classList.remove("playing");

    stopMatrix();  // Detiene animación al detener
  });

  // Mute botón
  muteBtn.addEventListener("click", () => {
    audio.muted = !audio.muted;
    muteBtn.innerHTML = audio.muted
      ? '<i class="fas fa-volume-mute"></i>'
      : '<i class="fas fa-volume-up"></i>';
  });

  // Control de volumen
  volumeSlider.addEventListener("input", () => {
    audio.volume = volumeSlider.value;
  });

  /* =============================== */
  /* EVENTOS DEL STREAM */
  /* =============================== */

  // Cuando el audio termina
  audio.addEventListener("ended", () => {
    isPlaying = false;
    playBtn.innerHTML = '<i class="fas fa-play"></i>';
    liveIndicator.textContent = "OFFLINE";
    liveIndicator.classList.remove("active");
    playerContainer.classList.remove("playing");
    stopMatrix();  // Detiene animación al finalizar
  });

  // Error en el stream
  audio.addEventListener("error", () => {
    console.warn("Stream no disponible");
    stopMatrix();
  });

});

