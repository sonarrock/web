/* ===============================
   DISCO DE LA SEMANA — JS FIX TOTAL
=============================== */
document.addEventListener("DOMContentLoaded", () => {
  const audio = document.getElementById("disco-audio");
  const playBtn = document.getElementById("disco-play-btn");
  const progressFill = document.getElementById("disco-progress-fill");

  if (!audio || !playBtn || !progressFill) return;

  let isPlaying = false;

  playBtn.addEventListener("click", async () => {
    try {
      if (!isPlaying) {
        await audio.play();
        isPlaying = true;
        playBtn.textContent = "⏸ Pausar";
      } else {
        audio.pause();
        isPlaying = false;
        playBtn.textContent = "▶ Escuchar";
      }
    } catch (err) {
      console.warn("No se pudo reproducir el preview:", err);
    }
  });

  audio.addEventListener("timeupdate", () => {
    if (!audio.duration) return;
    const percent = (audio.currentTime / audio.duration) * 100;
    progressFill.style.width = `${percent}%`;
  });

  audio.addEventListener("ended", () => {
    isPlaying = false;
    playBtn.textContent = "▶ Escuchar";
    progressFill.style.width = "0%";
  });

  audio.addEventListener("pause", () => {
    if (audio.currentTime < audio.duration && !audio.ended) {
      isPlaying = false;
      playBtn.textContent = "▶ Escuchar";
    }
  });

  audio.addEventListener("play", () => {
    isPlaying = true;
    playBtn.textContent = "⏸ Pausar";
  });
});
