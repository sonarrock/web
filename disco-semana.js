/* ===============================
   DISCO DE LA SEMANA
=============================== */
document.addEventListener("DOMContentLoaded", () => {

  const discoAudio = document.getElementById("disco-audio");
  const cover = document.getElementById("cover");
  const trackTitle = document.getElementById("track-title");

  if (!discoAudio) return;

  // 🔥 Datos del disco
  const discoData = {
    titulo: "Disco de la Semana",
    audio: "disco-semana/aretha-franklin-lady-soul-fixed.mp3",
    portada: "disco-semana/portada.jpg"
  };

  // Título
  if (trackTitle) {
    trackTitle.textContent = discoData.titulo;
  }

  // Portada
  if (cover) {
    cover.src = discoData.portada;
  }

  // 🎧 AUDIO (CLAVE)
  discoAudio.src = discoData.audio;
  discoAudio.load();

});
