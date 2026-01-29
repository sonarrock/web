document.addEventListener("DOMContentLoaded", () => {
  const fileName = "Aretha Franklin - Lady Soul.mp3";
  const audio = document.getElementById("disco-audio");
  const cover = document.getElementById("cover");
  const title = document.getElementById("track-title");
  const container = document.getElementById("disco-player");

  if (!audio || !cover || !container) return;

  // Mostrar nombre del disco dentro del contenedor, sobre el audio
  title.textContent = fileName.replace(".mp3", "");
  title.style.color = "#ffffff"; // letras blancas
  title.style.marginBottom = "5px";

  // Asignar archivo de audio (link directo Google Drive)
  audio.src = "https://docs.google.com/uc?export=download&id=1MPEw-cYMHhLvv7EbPfJJNII5ZwMWuWhQ";
  audio.load();

  // Asignar portada
  cover.src = `https://raw.githubusercontent.com/sonarrock/web/main/El%20Disco%20De%20La%20Semana/portada.jpg?v=${Date.now()}`;
  cover.classList.add("disco-cover");
});
