/* ===============================
   SONAR ROCK – PLAYER STREAMING
=============================== */

document.addEventListener("DOMContentLoaded", () => {

  const audio = document.getElementById("radio-audio");
  const playBtn = document.getElementById("playPauseBtn");
  const stopBtn = document.getElementById("stop-btn");
  const muteBtn = document.getElementById("mute-btn");
  const volumeSlider = document.getElementById("volume");
  const liveIndicator = document.getElementById("live-indicator");

  if (!audio || !playBtn || !stopBtn || !muteBtn || !volumeSlider) {
    console.warn("Sonar Rock Player: elementos faltantes");
    return;
  }

  let isPlaying = false;

  /* ===============================
     CONFIG AUDIO
  =============================== */
  audio.volume = volumeSlider.value;
  audio.preload = "none";

  /* ===============================
     PLAY / PAUSE
  =============================== */
  playBtn.addEventListener("click", async () => {
    if (!isPlaying) {
      try {
        await audio.play();
        isPlaying = true;

        playBtn.innerHTML = '<i class="fas fa-pause"></i>';
        liveIndicator.classList.add("active");
        liveIndicator.querySelector(".text").textContent = "EN VIVO";

      } catch (err) {
        console.error("No se pudo reproducir el stream:", err);
      }
    } else {
      pauseStream();
    }
  });

  function pauseStream() {
    audio.pause();
    isPlaying = false;

    playBtn.innerHTML = '<i class="fas fa-play"></i>';
    liveIndicator.classList.remove("active");
    liveIndicator.querySelector(".text").textContent = "PROGRAMACIÓN";
  }

  /* ===============================
     STOP
  =============================== */
  stopBtn.addEventListener("click", () => {
    pauseStream();
    audio.load(); // resetea stream correctamente
  });

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
     ERRORES STREAM
  =============================== */
  audio.addEventListener("error", () => {
    console.warn("Stream no disponible");
    pauseStream();
  });

});
