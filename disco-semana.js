// =========================
// Disco de la Semana JS
// =========================
document.addEventListener("DOMContentLoaded", () => {
  console.log("🎵 disco-semana.js cargado");

  const discoAudio = document.getElementById("disco-audio");
  
discoAudio.addEventListener("play", () => {
  if (radioAudio && !radioAudio.paused) {
    radioAudio.pause();
  }
});

  const cover = document.getElementById("cover");
  const trackTitle = document.getElementById("track-title");

  if (!discoAudio || !cover || !trackTitle) {
    console.error("❌ Elementos del Disco de la Semana no encontrados");
    return;
  }

  const discoData = {
    title: "Aretha Franklin – Lady Soul",
    audio: "https://www.dropbox.com/scl/fi/l2n20n2zkwkwxibnggtmh/Aretha-Franklin-Lady-Soul.mp3?dl=1",
    cover: "/web/disco-semana/portada.jpg"
  };

  // Título
  trackTitle.textContent = discoData.title;

  // Audio
  discoAudio.src = discoData.audio;
  discoAudio.load();

  // Portada
  cover.src = discoData.cover;

  console.log("✅ Disco de la semana listo");
});
