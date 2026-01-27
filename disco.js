// ----------------------------
// DISCO DE LA SEMANA
// ----------------------------
const fileName = "Fleetwood Mac - Rumours.mp3"; // cambiar cada semana
const discoAudio = document.getElementById("disco-audio");
const cover = document.getElementById("cover");
const trackTitle = document.getElementById("track-title");

// Si quieres mostrar título dentro del audio o por JS
trackTitle && (trackTitle.textContent = "Fleetwood Mac – Rumours");

// Portada
cover.src =
  "https://raw.githubusercontent.com/sonarrock/web/main/El%20Disco%20De%20La%20Semana/portada.jpg?v=" + Date.now();

// Audio
discoAudio.src =
  "https://raw.githubusercontent.com/sonarrock/web/main/El%20Disco%20De%20La%20Semana/" + fileName;

// Zoom animado (opcional)
let zoomDirection = 1;
let zoomInterval;

discoAudio.addEventListener("play", () => {
  zoomInterval = setInterval(() => {
    let scale = parseFloat(cover.style.transform.replace(/[^\d.]/g, "")) || 1;
    scale += 0.0015 * zoomDirection;
    if (scale >= 1.03) zoomDirection = -1;
    if (scale <= 0.97) zoomDirection = 1;
    cover.style.transform = `scale(${scale})`;
    cover.style.boxShadow = `0 0 18px rgba(255,102,0,0.6)`;
  }, 20);
});

discoAudio.addEventListener("pause", resetCover);
discoAudio.addEventListener("ended", resetCover);


function resetCover() {
  clearInterval(zoomInterval);
  cover.style.transform = "scale(1)";
  cover.style.boxShadow = "none";
}


// Título del disco sin extensión
trackTitle.textContent = fileName.replace(/\.mp3$/i, "");
document.getElementById("disco-title").textContent = trackTitle.textContent;
