document.addEventListener("DOMContentLoaded", () => {
  const fileName = "Aretha Franklin - Lady Soul";

  const audio = document.getElementById("disco-audio");
  const cover = document.getElementById("cover");
  const titleEl = document.getElementById("track-title");

  if (!audio || !cover || !titleEl) return;

  titleEl.textContent = fileName;

  // LINK DIRECTO DE GOOGLE DRIVE
  audio.src = "https://drive.google.com/uc?export=download&id=1MPEw-cYMHhLvv7EbPfJJNII5ZwMWuWhQ";
  audio.load();

  // Portada (GitHub o donde la alojes)
  cover.src = "https://raw.githubusercontent.com/sonarrock/web/main/El%20Disco%20De%20La%20Semana/portada.jpg";
});
