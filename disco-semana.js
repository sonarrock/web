document.addEventListener("DOMContentLoaded", () => {

  const discoData = {
    title: "Aretha Franklin - Lady Soul",
    src: "https://drive.google.com/uc?export=download&id=1MPEw-cYMHhLvv7EbPfJJNII5ZwMWuWhQ",
    cover: "https://raw.githubusercontent.com/sonarrock/web/main/El%20Disco%20De%20La%20Semana/portada.jpg"
  };

  const cover = document.getElementById("cover");
  const titleEl = document.getElementById("track-title");
  const audio = document.getElementById("disco-audio");

  if (!cover || !titleEl || !audio) {
    console.warn("Disco de la Semana: elementos no encontrados");
    return;
  }

  titleEl.textContent = discoData.title;
  cover.src = discoData.cover;

  audio.src = discoData.src;
  audio.load();
});
