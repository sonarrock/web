document.addEventListener('DOMContentLoaded', function() {
  // ======== ELEMENTOS ========
  const playBtn = document.getElementById('play-btn');
  const stopBtn = document.getElementById('stop-btn');
  const muteBtn = document.getElementById('mute-btn');
  const audio = document.getElementById('audio');
  const nowPlaying = document.getElementById('now-playing');
  const canvas = document.getElementById('matrix');
  const ctx = canvas.getContext('2d');

  let isPlaying = false;
  let isMuted = false;
  let matrixInterval = null;

  // ======== METADATOS ========
  async function cargarMetadata() {
    try {
      const response = await fetch("https://stream.zeno.fm/ezq3fcuf5ehvv?json=1");
      const data = await response.json();

      if (data.artist && data.title) {
        nowPlaying.textContent = `${data.artist} - ${data.title}`;
      } else {
        nowPlaying.textContent = "Escuchando Sonar Rock";
      }
    } catch (error) {
      nowPlaying.textContent = "Cargando canción...";
      console.error("Error cargando metadata:", error);
    }
  }
  cargarMetadata();
  setInterval(cargarMetadata, 15000);

  // ======== CONTROLES ========
  playBtn.addEventListener('click', function() {
    if (!isPlaying) {
      audio.play().catch(e => console.error('Error al reproducir:', e));
      playBtn.innerHTML = '<i class="fas fa-pause"></i>';
      startMatrix();
    } else {
      audio.pause();
      playBtn.innerHTML = '<i class="fas fa-play"></i>';
      stopMatrix();
    }
    isPlaying = !isPlaying;
  });

  stopBtn.addEventListener('click', function() {
    audio.pause();
    audio.currentTime = 0;
    playBtn.innerHTML = '<i class="fas fa-play"></i>';
    isPlaying = false;
    stopMatrix();
  });

  muteBtn.addEventListener('click', function() {
    isMuted = !isMuted;
    audio.muted = isMuted;
    muteBtn.innerHTML = isMuted ? '<i class="fas fa-volume-mute"></i>' : '<i class="fas fa-volume-up"></i>';
  });

// MATRIX ANIMATION
const canvas = document.getElementById("matrix");
const ctx = canvas.getContext("2d");

// Ajusta tamaño del canvas
function resizeCanvas() {
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);


// Letras para la animación
const letters = "アァカサタナハマヤャラワガザダバパイィキシチニヒミリギジヂビピウゥクスツヌフムユュルグズヅブプエェケセテネヘメレゲゼデベペオォコソトノホモヨョロヲゴゾドボポABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const fontSize = 12; // más pequeño = más densidad
let columns = Math.floor(canvas.width / fontSize);
let drops = Array(columns).fill(0);

// Redimensiona columnas si cambia el tamaño
function updateColumns() {
  columns = Math.floor(canvas.width / fontSize);
  drops = Array(columns).fill(0);
}
window.addEventListener("resize", updateColumns);

function drawMatrix() {
  ctx.fillStyle = "rgba(0,0,0,0.5)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#0F0";
  ctx.font = fontSize + "px monospace";

  for (let i = 0; i < drops.length; i++) {
    const text = letters.charAt(Math.floor(Math.random() * letters.length));
    ctx.fillText(text, i * fontSize, drops[i] * fontSize);
    if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) drops[i] = 0;
    drops[i]++;
  }
}

// CONTROLES
const playBtn = document.getElementById("play-btn");
const stopBtn = document.getElementById("stop-btn");
const muteBtn = document.getElementById("mute-btn");
const audio = document.getElementById("audio");

let matrixInterval = null;

// Play
playBtn.addEventListener("click", () => {
  if (!matrixInterval) matrixInterval = setInterval(drawMatrix, 50);
  if (audio.paused) audio.play();
});

// Stop
stopBtn.addEventListener("click", () => {
  clearInterval(matrixInterval);
  matrixInterval = null;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  audio.pause();
  audio.currentTime = 0;
});

// Mute / Unmute
muteBtn.addEventListener("click", () => {
  audio.muted = !audio.muted;
  muteBtn.innerHTML = audio.muted ? '<i class="fas fa-volume-off"></i>' : '<i class="fas fa-volume-mute"></i>';
});
