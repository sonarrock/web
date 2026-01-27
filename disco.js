// =========================
// REPRODUCTORES INDEPENDIENTES
// =========================

// Disco de la Semana
const discoAudio = document.getElementById("disco-audio");
const discoProgress = document.getElementById("disco-progress");
const discoProgressContainer = document.getElementById("disco-progress-container");
const cover = document.getElementById("cover");
const trackTitle = document.getElementById("track-title");

// Archivo de audio
const fileName = "Fleetwood Mac - Rumours.mp3"; // cambiar cada semana
discoAudio.src = "https://raw.githubusercontent.com/sonarrock/web/main/El%20Disco%20De%20La%20Semana/" + fileName;
trackTitle.textContent = fileName.replace(/\.mp3$/i,""); // solo nombre sin extension

// Portada
cover.src = "https://raw.githubusercontent.com/sonarrock/web/main/El%20Disco%20De%20La%20Semana/portada.jpg?v=" + Date.now();

// Barra de progreso
discoAudio.addEventListener("timeupdate", () => {
  if(discoAudio.duration) {
    discoProgress.style.width = (discoAudio.currentTime / discoAudio.duration) * 100 + "%";
  }
});

discoProgressContainer.addEventListener("click", e => {
  const rect = discoProgressContainer.getBoundingClientRect();
  discoAudio.currentTime = ((e.clientX - rect.left) / rect.width) * discoAudio.duration;
});

// Animación portada
let zoomDirection = 1;
let zoomInterval;

function startCoverAnimation(audio, img) {
  zoomInterval = setInterval(() => {
    let scale = parseFloat(img.style.transform.replace(/[^\d.]/g, "")) || 1;
    scale += 0.0015 * zoomDirection;
    if(scale >= 1.03) zoomDirection = -1;
    if(scale <= 0.97) zoomDirection = 1;
    img.style.transform = `scale(${scale})`;
    img.style.boxShadow = `0 0 18px rgba(255,102,0,0.6)`;
  }, 20);
}

function resetCover(img) {
  clearInterval(zoomInterval);
  img.style.transform = "scale(1)";
  img.style.boxShadow = "none";
}

// =========================
// CONTROL DE MULTIPLES AUDIOS
// =========================
const audios = document.querySelectorAll("audio");

audios.forEach(audio => {
  // Pausar todos los demás audios al reproducir uno
  audio.addEventListener("play", () => {
    audios.forEach(a => {
      if(a !== audio) a.pause();
    });

    // Solo animar portada del disco de la semana
    if(audio === discoAudio) startCoverAnimation(audio, cover);
  });

  audio.addEventListener("pause", () => {
    if(audio === discoAudio) resetCover(cover);
  });

  audio.addEventListener("ended", () => {
    if(audio === discoAudio) resetCover(cover);
  });
});
