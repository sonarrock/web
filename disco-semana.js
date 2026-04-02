// ===============================
// SONAR ROCK - DISCO DE LA SEMANA
// ===============================

document.addEventListener("DOMContentLoaded", () => {
  const audio = document.getElementById("disco-audio");
  const cover = document.getElementById("cover");
  const trackTitle = document.getElementById("track-title");
  const player = document.getElementById("disco-player");

  const discoData = {
    titulo: "Radiohead - The Bends",
    audio: "disco-semana/Radiohead - The Bends.mp3",
    portada: "disco-semana/portada.jpg"
  };

  if (trackTitle) {
    trackTitle.textContent = discoData.titulo;
  }

  if (cover) {
    cover.src = discoData.portada;
    cover.alt = discoData.titulo;
  }

  if (audio) {
    audio.src = discoData.audio;
    audio.load();
    audio.controls = true;
  }

  if (!audio || !player) return;

  audio.addEventListener("play", () => {
    player.classList.add("playing");
  });

  audio.addEventListener("pause", () => {
    player.classList.remove("playing");
  });

  audio.addEventListener("ended", () => {
    player.classList.remove("playing");
  });
});
