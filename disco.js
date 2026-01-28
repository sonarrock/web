// ----------------------------
// DISCO DE LA SEMANA
// ----------------------------
const fileName = "Fleetwood Mac - Rumours.mp3"; // cambiar cada semana
const discoAudio = document.getElementById("disco-audio");
const discoProgress = document.getElementById("disco-progress");
const discoProgressContainer = document.getElementById("disco-progress-container");
const cover = document.getElementById("cover");
const trackTitle = document.getElementById("track-title");

// Inicializa el estilo de sombra para que la animación funcione correctamente
cover.style.boxShadow = `0 0 18px rgba(255,102,0,0.6)`;
cover.style.transform = `scale(1)`;

// Mostrar título sin la extensión .mp3
trackTitle.textContent = fileName.replace(".mp3", "");

// Asignar archivo al audio (asegúrate de que esta URL pública de GitHub funcione como fuente de audio)
discoAudio.src = "https://raw.githubusercontent.com/sonarrock/web/main/El%20Disco%20De%20La%20Semana/" + fileName;

// Asignar portada (el truco del Date.now() es bueno para evitar caché al cambiar la portada)
cover.src = "https://raw.githubusercontent.com/sonarrock/web/main/El%20Disco%20De%20La%20Semana/portada.jpg?v=" + Date.now();

// PROGRESO
discoAudio.addEventListener("timeupdate", () => {
  if (discoAudio.duration) {
    // Calculamos el porcentaje de ancho para la barra de progreso
    const progressPercent = (discoAudio.currentTime / discoAudio.duration) * 100;
    discoProgress.style.width = progressPercent + "%";
    
    // Actualizamos el atributo aria-valuenow para accesibilidad
    discoProgressContainer.setAttribute('aria-valuenow', progressPercent.toFixed(1));
  }
});

// Permite hacer clic en la barra para buscar en el audio
discoProgressContainer.addEventListener("click", e => {
  // Aseguramos que el stream principal esté pausado si se interactúa con este reproductor
  const mainAudio = document.getElementById("radio-audio");
  if (!mainAudio.paused) {
      mainAudio.pause();
      // El script player.js manejará el resto de la UI del reproductor principal
  }

  const rect = discoProgressContainer.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const width = rect.width;
  
  if (discoAudio.duration) {
    // Calcula el nuevo tiempo y lo asigna
    discoAudio.currentTime = (clickX / width) * discoAudio.duration;
  }
});

// ANIMACIÓN PORTADA (Efecto de zoom sutil)
let zoomDirection = 1;
let zoomInterval;

discoAudio.addEventListener("play", () => {
  zoomInterval = setInterval(() => {
    let scale =
      parseFloat(cover.style.transform.replace(/[^\d.]/g, "")) || 1;
    scale += 0.0015 * zoomDirection;
    if (scale >= 1.03) zoomDirection = -1;
    if (scale <= 0.97) zoomDirection = 1;
    cover.style.transform = `scale(${scale})`;
    // Ya que definimos la sombra al inicio, no es necesario reasignarla en cada frame.
  }, 20);
});

discoAudio.addEventListener("pause", resetCover);
discoAudio.addEventListener("ended", resetCover);

function resetCover() {
  clearInterval(zoomInterval);
  cover.style.transform = "scale(1)";
  // Mantenemos la sombra activa incluso cuando está pausado para que se vea bien.
  // cover.style.boxShadow = "0 0 18px rgba(255,102,0,0.6)"; 
}
