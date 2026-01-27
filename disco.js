// ----------------------------
// DISCO DE LA SEMANA
// ----------------------------
const fileName = "Fleetwood Mac - Rumours.mp3"; // cambiar cada semana
const discoAudio = document.getElementById("disco-audio");
const discoProgress = document.getElementById("disco-progress");
const discoProgressContainer = document.getElementById("disco-progress-container");
const cover = document.getElementById("cover");
const trackTitle = document.getElementById("track-title");

// Mostrar título sin la extensión .mp3
trackTitle.textContent = fileName.replace(/\.mp3$/, "");

// Portada
cover.src = "https://raw.githubusercontent.com/sonarrock/web/main/El%20Disco%20De%20La%20Semana/portada.jpg?v=" + Date.now();

// Fuente del audio
discoAudio.src = "https://raw.githubusercontent.com/sonarrock/web/main/El%20Disco%20De%20La%20Semana/" + encodeURIComponent(fileName);

// ----------------------------
// PROGRESO
// ----------------------------
discoAudio.addEventListener("timeupdate", () => {
  if (discoAudio.duration) {
    discoProgress.style.width = (discoAudio.currentTime / discoAudio.duration) * 100 + "%";
  }
});

discoProgressContainer.addEventListener("click", e => {
  const rect = discoProgressContainer.getBoundingClientRect();
  discoAudio.currentTime = ((e.clientX - rect.left) / rect.width) * discoAudio.duration;
});

// ----------------------------
// ANIMACIÓN PORTADA
// ----------------------------
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
  cover.style.boxShadow = "0 0 18px rgba(255,102,0,0.6)";
}
