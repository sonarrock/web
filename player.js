document.addEventListener("DOMContentLoaded", () => {

  const audio = document.getElementById("radio-audio");
  const playBtn = document.getElementById("playPauseBtn");
  const stopBtn = document.getElementById("stop-btn");
  const muteBtn = document.getElementById("mute-btn");
  const volumeSlider = document.getElementById("volume");
  const liveIndicator = document.getElementById("live-indicator");
  const liveText = liveIndicator.querySelector(".text");
  const playerContainer = document.querySelector(".player-container");

  let isPlaying = false;

  /* ===============================
     CONFIG STREAM
  =============================== */
  audio.preload = "none";
  audio.volume = volumeSlider.value;

  /* ===============================
     PLAY / PAUSE
  =============================== */
  playBtn.addEventListener("click", () => {

    if (!isPlaying) {
      audio.load(); // 👈 CLAVE para streams Zeno

      audio.play().then(() => {
        isPlaying = true;
        playBtn.innerHTML = '<i class="fas fa-pause"></i>';

        liveText.textContent = "EN VIVO";
        liveIndicator.classList.add("active");
        playerContainer.classList.add("playing");

        if (typeof startMatrix === "function") startMatrix();
      }).catch(err => {
        console.error("No se pudo reproducir el stream:", err);
      });

    } else {
      audio.pause();
      isPlaying = false;

      playBtn.innerHTML = '<i class="fas fa-play"></i>';
      liveText.textContent = "PROGRAMACIÓN";
      liveIndicator.classList.remove("active");
      playerContainer.classList.remove("playing");

      if (typeof stopMatrix === "function") stopMatrix();
    }
  });

  /* ===============================
     STOP (SIN currentTime)
  =============================== */
  stopBtn.addEventListener("click", () => {
    audio.pause();
    audio.src = audio.src; // 👈 reset seguro para stream

    isPlaying = false;
    playBtn.innerHTML = '<i class="fas fa-play"></i>';
    liveText.textContent = "PROGRAMACIÓN";
    liveIndicator.classList.remove("active");
    playerContainer.classList.remove("playing");

    if (typeof stopMatrix === "function") stopMatrix();
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
     EVENTOS STREAM
  =============================== */
  audio.addEventListener("error", () => {
    console.warn("Stream no disponible");
    liveText.textContent = "OFFLINE";
    liveIndicator.classList.remove("active");
    playerContainer.classList.remove("playing");
    isPlaying = false;

    if (typeof stopMatrix === "function") stopMatrix();
  });

});
