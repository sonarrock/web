document.addEventListener("DOMContentLoaded", () => {
  const fileName = "Aretha Franklin - Lady Soul.mp3";
  const audio = document.getElementById("disco-audio");
  const cover = document.getElementById("cover");
  const title = document.getElementById("track-title");
  const container = document.getElementById("disco-player");

  if (!audio || !cover || !title || !container) return;

  // Título del disco dentro del contenedor
  title.textContent = fileName.replace(".mp3", "");

  // Asignar archivo de audio
  audio.src = `https://raw.githubusercontent.com/sonarrock/web/main/El%20Disco%20De%20La%20Semana/${encodeURIComponent(fileName)}`;
  audio.load();

  // Asignar portada
  cover.src = `https://raw.githubusercontent.com/sonarrock/web/main/El%20Disco%20De%20La%20Semana/portada.jpg?v=${Date.now()}`;
});
