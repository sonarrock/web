document.addEventListener("DOMContentLoaded", () => {

  const discoData = {
    title: "Aretha Franklin - Lady Soul",
    src: "https://raw.githubusercontent.com/sonarrock/web/main/El%20Disco%20De%20La%20Semana/Aretha%20Franklin%20-%20Lady%20Soul.mp3",
    cover: "https://raw.githubusercontent.com/sonarrock/web/main/El%20Disco%20De%20La%20Semana/portada.jpg"
  };

  const cover = document.getElementById("cover");
  const discoAudio = document.getElementById("disco-audio");
  const titleEl = document.getElementById("track-title");

  // 🔒 Protección total (nunca vuelve a romper)
  if (!cover || !discoAudio || !titleEl) {
    console.warn("Disco de la semana: elementos no encontrados");
    return;
  }

  // Portada
  cover.src = discoData.cover;

  // Título dentro del contenedor
  titleEl.textContent = discoData.title;

  // Audio (FORMA CORRECTA)
  discoAudio.src = discoData.src;
  discoAudio.load();
});
