// =========================
// Disco de la Semana JS
// =========================
document.addEventListener("DOMContentLoaded", () => {
  console.log("🎵 disco-semana.js cargado correctamente");

  // Elementos
  const discoAudio = document.getElementById("disco-audio");
  const cover = document.getElementById("cover");
  const trackTitle = document.getElementById("track-title");
  const radioAudio = document.getElementById("radio-audio"); // opcional

  // Verificación
  if (!discoAudio || !cover || !trackTitle) {
    console.error("❌ Elementos del Disco de la Semana no encontrados en el DOM");
    return;
  }

  // Pausar radio si se reproduce el disco
  discoAudio.addEventListener("play", () => {
    if (radioAudio && !radioAudio.paused) {
      radioAudio.pause();
    }
  });

  // Datos del Disco de la Semana
  const discoData = {
    title: "Aretha Franklin – Lady Soul",
    audio: "https://www.dropbox.com/scl/fi/l2n20n2zkwkwxibnggtmh/Aretha-Franklin-Lady-Soul.mp3?dl=1",
    cover: "web/disco-semana/portada.jpg"
  };

  // Cargar disco
  cover.src = discoData.cover;
  trackTitle.textContent = discoData.title;
  discoAudio.src = discoData.audio;
  discoAudio.load();

  console.log("🎶 Disco de la Semana cargado:", discoData);
});
