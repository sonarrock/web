document.addEventListener("DOMContentLoaded", () => {
  const fileName = "Aretha Franklin - Lady Soul.mp3";
  const audio = document.getElementById("disco-audio");
  const cover = document.getElementById("cover");
  const container = document.getElementById("disco-player");
  const titleEl = document.getElementById("track-title");

  if (!audio || !cover || !container || !titleEl) return;

  // Mostrar el nombre del disco dentro del contenedor sobre el audio
  titleEl.textContent = fileName.replace(".mp3", "");

  // Asignar archivo de audio (GitHub Pages)
  audio.src = `https://sonarrock.github.io/web/El%20Disco%20De%20La%20Semana/${encodeURIComponent(fileName)}`;
  audio.load();

  // Asignar portada
  cover.src = `https://sonarrock.github.io/web/El%20Disco%20De%20La%20Semana/portada.jpg?v=${Date.now()}`;
  cover.classList.add("disco-cover");
});
