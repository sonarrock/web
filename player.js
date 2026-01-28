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

  let isPlaying = false;
  let matrixAnimationId = null;

  /* ===============================
     SEGURIDAD
  =============================== */
  if (!audio || !playBtn || !stopBtn || !muteBtn || !volumeSlider) {
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
     (usa funciones de matrix.js)
  =============================== */
  function resizeCanvas() {
    const container = document.querySelector(".player-container");
    if (!container) return;

    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;

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
     BOTÓN PLAY / PAUSE
  =============================== */
  playBtn.addEventListener("click", () => {
    if (!isPlaying) {
      audio.play()
        .then(() => {
          isPlaying = true;
          playBtn.innerHTML = '<i class="fas fa-pause"></i>';
          liveIndicator?.classList.add("active");
          startMatrix();
        })
        .catch(err => {
          console.error("Error al reproducir:", err);
        });
    } else {
      audio.pause();
      isPlaying = false;
      playBtn.innerHTML = '<i class="fas fa-play"></i>';
      liveIndicator?.classList.remove("active");
      stopMatrix();
    }
  });

  /* ===============================
     BOTÓN STOP
  =============================== */
  stopBtn.addEventListener("click", () => {
    audio.pause();
    audio.currentTime = 0;

    isPlaying = false;
    playBtn.innerHTML = '<i class="fas fa-play"></i>';
    liveIndicator?.classList.remove("active");

    stopMatrix();
  });

  /* ===============================
     BOTÓN MUTE
  =============================== */
  muteBtn.addEventListener("click", () => {
    audio.muted = !audio.muted;
    muteBtn.innerHTML = audio.muted
      ? '<i class="fas fa-volume-mute"></i>'
      : '<i class="fas fa-volume-up"></i>';
  });

  /* ===============================
     CONTROL DE VOLUMEN
     (0–1 como en tu HTML)
  =============================== */
  volumeSlider.addEventListener("input", () => {
    audio.volume = volumeSlider.value;
  });

  /* ===============================
     EVENTOS DE AUDIO
  =============================== */
  audio.addEventListener("ended", () => {
    isPlaying = false;
    playBtn.innerHTML = '<i class="fas fa-play"></i>';
    liveIndicator?.classList.remove("active");
    stopMatrix();
  });

  audio.addEventListener("error", () => {
    console.warn("Stream no disponible");
    stopMatrix();
  });
});
