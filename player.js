/* ===============================
   SONAR ROCK – PLAYER FINAL
=============================== */

document.addEventListener("DOMContentLoaded", () => {

  /* ===============================
     ELEMENTOS
  =============================== */
  const audio = document.getElementById("radio-audio");
  const playBtn = document.getElementById("playPauseBtn");
  const stopBtn = document.getElementById("stop-btn");
  const muteBtn = document.getElementById("mute-btn");
  const volumeSlider = document.getElementById("volume");
  const liveIndicator = document.getElementById("live-indicator");
  const canvas = document.getElementById("matrixCanvas");
  const playerContainer = document.querySelector(".player-container");

  let isPlaying = false;
  let matrixAnimationId = null;

  /* ===============================
     SEGURIDAD
  =============================== */
  if (!audio || !playBtn || !stopBtn || !muteBtn || !volumeSlider || !playerContainer) {
    console.warn("Sonar Rock Player: elementos faltantes en el DOM");
    return;
  }

  /* ===============================
     AUDIO CONFIG
  =============================== */
  audio.preload = "none";
  audio.volume = volumeSlider.value;

  /* ===============================
     MATRIX CONTROL
  =============================== */
  function resizeCanvas() {
    canvas.width = playerContainer.clientWidth;
    canvas.height = playerContainer.clientHeight;

    if (typeof initMatrix === "function") {
      initMatrix();
    }
  }

  function startMatrix() {
    if (matrixAnimationId) return;

    const animate = () => {
      if (typeof drawMatrixFrame === "function") {
        drawMatrixFrame();
      }
      matrixAnimationId = requestAnimationFrame(animate);
    };

    animate();
  }

  function stopMatrix() {
    if (matrixAnimationId) {
      cancelAnimationFrame(matrixAnimationId);
      matrixAnimationId = null;
    }

    if (typeof clearMatrix === "function") {
      clearMatrix();
    }
  }

  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();

  /* ===============================
     PLAY / PAUSE
  =============================== */
  playBtn.addEventListener("click", () => {
    if (!isPlaying) {
      audio.play().then(() => {
        isPlaying = true;

        playBtn.innerHTML = '<i class="fas fa-pause"></i>';
        liveIndicator.textContent = "EN VIVO";
        liveIndicator.classList.add("active");

        playerContainer.classList.add("playing");
        startMatrix();

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
    liveIndicator.textContent = "OFFLINE";
    liveIndicator.classList.remove("active");

    playerContainer.classList.remove("playing");
    stopMatrix();
  }

  /* ===============================
     STOP
  =============================== */
  stopBtn.addEventListener("click", () => {
    audio.pause();
    audio.currentTime = 0;
    pauseStream();
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
  audio.addEventListener("ended", pauseStream);
  audio.addEventListener("error", () => {
    console.warn("Stream no disponible");
    pauseStream();
  });

});
