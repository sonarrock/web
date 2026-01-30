document.addEventListener("DOMContentLoaded", () => {

  const discoData = {
    title: "Aretha Franklin - Lady Soul",
    src: "https://raw.githubusercontent.com/sonarrock/web/main/El%20Disco%20De%20La%20Semana/Aretha%20Franklin%20-%20Lady%20Soul.mp3",
    cover: "https://raw.githubusercontent.com/sonarrock/web/main/El%20Disco%20De%20La%20Semana/portada.jpg"
  };

  const cover = document.getElementById("cover");
  const titleEl = document.getElementById("track-title");
  const audio = document.getElementById("disco-audio");

  // Blindaje total
  if (!cover || !titleEl || !audio) {
    console.warn("Disco de la Semana: elementos no encontrados");
    return;
  }

  // Título dentro del reproductor
  titleEl.textContent = discoData.title;

  // Portada
  cover.src = discoData.cover;

  // Audio (FORMA CORRECTA)
  audio.src = discoData.src;
  audio.load();
});
