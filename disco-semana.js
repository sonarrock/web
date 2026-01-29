document.addEventListener("DOMContentLoaded", () => {
  const fileName = "Aretha Franklin - Lady Soul.mp3";
  const audio = document.getElementById("disco-audio");
  const cover = document.getElementById("cover");
  const container = document.getElementById("disco-player");
  const title = document.getElementById("track-title");

  if (!audio || !cover || !container || !title) return;

  // Mostrar el nombre del disco en letras blancas dentro del contenedor
  title.textContent = fileName.replace(".mp3", "");
  title.style.color = "#ffffff";
  title.style.fontSize = "1.2rem";
  title.style.textAlign = "center";
  title.style.marginBottom = "5px";

  // Link directo del MP3 en Google Drive
  audio.src = "https://drive.google.com/uc?export=download&id=1MPEw-cYMHhLvv7EbPfJJNII5ZwMWuWhQ";
  audio.load();

  // Asignar portada
  cover.src = "https://raw.githubusercontent.com/sonarrock/web/main/El%20Disco%20De%20La%20Semana/portada.jpg?v=" + Date.now();
  cover.classList.add("disco-cover");
});
