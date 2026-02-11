document.addEventListener("DOMContentLoaded", () => {

  const audio = document.getElementById("disco-audio");
  const cover = document.getElementById("cover");
  const trackTitle = document.getElementById("track-title");

  const discoData = {
    titulo: "Disco de la Semana",
    audio: "disco-semana/Van Halen - Van Halen.mp3",
    portada: "disco-semana/portada.jpg"
  };

  if (trackTitle) {
    trackTitle.textContent = discoData.titulo;
  }

  if (cover) {
    cover.src = discoData.portada;
  }

  if (audio) {
    audio.src = discoData.audio;

    // 🔥 CLAVE: forzar carga antes de mostrar
    audio.load();

    // 🔥 forzar repaint de controles
    audio.style.display = "block";
    audio.controls = true;
  }

});
