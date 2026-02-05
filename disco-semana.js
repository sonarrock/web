// =========================
// Disco de la Semana
// =========================
document.addEventListener("DOMContentLoaded", () => {
  console.log("🎵 Disco de la Semana JS cargado");

  const discoAudio = document.getElementById("disco-audio");
  const cover = document.getElementById("cover");
  const trackTitle = document.getElementById("track-title");
  const radioAudio = document.getElementById("radio-audio"); // opcional

  if (!discoAudio || !cover || !trackTitle) {
    console.error("❌ Elementos del Disco de la Semana no encontrados");
    return;
  }

  // Datos del disco
  const discoData = {
    title: "Aretha Franklin – Lady Soul",
    audio: "https://www.dropbox.com/scl/fi/l2n20n2zkwkwxibnggtmh/Aretha-Franklin-Lady-Soul.mp3?raw=1",
    cover: "web/disco-semana/portada.jpg"
  };

  // Cargar datos visuales
  cover.src = discoData.cover;
  trackTitle.textContent = discoData.title;
  discoAudio.src = discoData.audio;

  console.log("🎶 Disco preparado:", discoData);

  // Pausar radio si se reproduce el disco
  discoAudio.addEventListener("play", () => {
    if (radioAudio && !radioAudio.paused) {
      radioAudio.pause();
    }
  });

  // Debug útil
  discoAudio.addEventListener("error", () => {
    console.error("❌ Error cargando el audio del disco");
  });

  discoAudio.addEventListener("canplay", () => {
    console.log("✅ Audio listo para reproducirse");
  });
});
