/* ===============================
   DISCO DE LA SEMANA
=============================== */
document.addEventListener("DOMContentLoaded", () => {

  const discoAudio = document.getElementById("disco-audio");
  const cover = document.getElementById("cover");
  const trackTitle = document.getElementById("track-title");

  // 🔥 Datos del disco (ejemplo)
  const discoData = {
    titulo: "Disco de la Semana",
    audio: "disco-semana/aretha-franklin-lady-soul-fixed.mp3", //SUSTITUIR CADA SEMANA//
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

  // 🔥 AUDIO (CLAVE)
  if (discoAudio) {
    discoAudio.src = discoData.audio;
    discoAudio.load(); // 👈 OBLIGATORIO
  }

});

