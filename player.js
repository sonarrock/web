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

 // Matrix Animation
const canvas = document.getElementById("matrix");
const ctx = canvas.getContext("2d");

// Ajusta el tamaño del canvas
canvas.width = canvas.offsetWidth;
canvas.height = canvas.offsetHeight;

// Letras para la animación
const letters = "アァカサタナハマヤャラワガザダバパイィキシチニヒミリギジヂビピウゥクスツヌフムユュルグズヅブプエェケセテネヘメレゲゼデベペオォコソトノホモヨョロヲゴゾドボポABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const lettersArray = letters.split("");

// Tamaño de fuente más pequeño para más densidad
const fontSize = 10; // antes 14
const columns = Math.floor(canvas.width / fontSize);

// Array para mantener la posición de cada columna
const drops = [];
for (let i = 0; i < columns; i++) drops[i] = Math.random() * canvas.height;

// Función de animación
function drawMatrix() {
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#0F0";
    ctx.font = fontSize + "px monospace";

    for (let i = 0; i < drops.length; i++) {
        const text = lettersArray[Math.floor(Math.random() * lettersArray.length)];
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

        // Movimiento de la letra
        if (drops[i] * fontSize > canvas.height || Math.random() > 0.95) {
            drops[i] = 0;
        }

        drops[i]++;
    }

    requestAnimationFrame(drawMatrix);
}

// Ejecutar solo al dar Play
const playBtn = document.getElementById("play-btn");
let matrixRunning = false;

playBtn.addEventListener("click", () => {
    const audio = document.getElementById("audio");
    audio.play();
    if (!matrixRunning) {
        matrixRunning = true;
        drawMatrix();
    }
});
