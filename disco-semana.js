// ===============================
// SONAR ROCK - DISCO DE LA SEMANA
// ===============================

document.addEventListener("DOMContentLoaded", () => {
  const audio = document.getElementById("disco-audio");
  const cover = document.getElementById("cover");
  const trackTitle = document.getElementById("track-title");
  const player = document.getElementById("disco-player");

  // =========================================
  // EDITA SOLO ESTA PARTE CADA SEMANA
  // =========================================
  const discoData = {
    titulo: "Radiohead - The Bends",
    audio: "disco-semana/Radiohead - The Bends.mp3",
    portada: "disco-semana/portada.jpg"
  };

  // Si falta algo del HTML, no rompe
  if (!audio || !cover || !trackTitle || !player) {
    console.warn("Disco de la Semana: faltan elementos en el HTML.");
    return;
  }

  // Cargar contenido
  trackTitle.textContent = discoData.titulo;
  cover.src = discoData.portada;
  cover.alt = discoData.titulo;
  audio.src = discoData.audio;
  audio.load();

  // Animación del disco al reproducir
  audio.addEventListener("play", () => {
    player.classList.add("playing");
  });

  audio.addEventListener("pause", () => {
    player.classList.remove("playing");
  });

  audio.addEventListener("ended", () => {
    player.classList.remove("playing");
  });

  // Si hay error cargando el MP3
  audio.addEventListener("error", () => {
    console.error("Error al cargar el audio del Disco de la Semana.");
    trackTitle.textContent = "Error al cargar el disco";
    player.classList.remove("playing");
  });
});
