document.addEventListener("DOMContentLoaded", () => {

  const fileName = "Aretha Franklin - Lady Soul.mp3";

  const audio = document.getElementById("disco-audio");
  const cover = document.getElementById("cover");
  const title = document.getElementById("track-title");

  if (!audio || !cover || !title) return;

  title.textContent = fileName.replace(".mp3", "");

  audio.src =
    "https://raw.githubusercontent.com/sonarrock/web/main/El%20Disco%20De%20La%20Semana/" +
    encodeURIComponent(fileName);

  cover.src =
    "https://raw.githubusercontent.com/sonarrock/web/main/El%20Disco%20De%20La%20Semana/portada.jpg";
});
