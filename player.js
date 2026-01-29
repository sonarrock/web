document.addEventListener("DOMContentLoaded", () => {

  const STREAM_URL = "https://stream.zeno.fm/ezq3fcuf5ehvv";

  const audio = document.getElementById("radio-audio");
  const playBtn = document.getElementById("playPauseBtn");
  const stopBtn = document.getElementById("stop-btn");
  const muteBtn = document.getElementById("mute-btn");
  const volumeSlider = document.getElementById("volume");
  const liveIndicator = document.getElementById("live-indicator");
  const liveText = liveIndicator.querySelector(".text");
  const playerContainer = document.querySelector(".player-container");

  let isPlaying = false;

  audio.playsInline = true;
  audio.preload = "none";
  audio.volume = volumeSlider.value;

  /* ===============================
     PLAY / PAUSE — iOS FRIENDLY
  =============================== */
  playBtn.addEventListener("click", () => {

    if (!isPlaying) {

      // 👇 ASIGNAR STREAM SOLO AQUÍ (gesto del usuario)
      audio.src = STREAM_URL;

      audio.play().then(() => {
        isPlaying = true;
        playBtn.innerHTML = '<i class="fas fa-pause"></i>';

        liveText.textContent = "EN VIVO";
        liveIndicator.classList.add("active");
        playerContainer.classList.add("playing");

        if (typeof startMatrix === "function") startMatrix();
      }).catch(err => {
        console.error("iOS bloqueó el audio:", err);
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
     STOP (iOS SAFE)
  =============================== */
  stopBtn.addEventListener("click", () => {
    audio.pause();
    audio.removeAttribute("src"); // 👈 iOS seguro
    audio.load();

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
     ERROR STREAM
  =============================== */
  audio.addEventListener("error", () => {
    liveText.textContent = "OFFLINE";
    liveIndicator.classList.remove("active");
    playerContainer.classList.remove("playing");
    isPlaying = false;

    if (typeof stopMatrix === "function") stopMatrix();
  });

});
