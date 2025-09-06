const audio = document.getElementById("audio");
const playBtn = document.getElementById("play-btn");
const stopBtn = document.getElementById("stop-btn");
const muteBtn = document.getElementById("mute-btn");
const progress = document.getElementById("progress");
const timeDisplay = document.getElementById("time-display");
const canvas = document.getElementById("matrix");
const ctx = canvas.getContext("2d");

let animationId;
let matrixRunning = false;

// Ajuste de tamaño del canvas al contenedor
function resizeCanvas() {
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// Letras del efecto Matrix
const letters = "アカサタナハマヤラワイウエオabcdefghijklmnopqrstuvwxyz0123456789";
const fontSize = 20;
const columns = Math.floor(canvas.width / fontSize);
const drops = Array(columns).fill(0);

// Función de dibujo vertical
function drawMatrix() {
  ctx.fillStyle = "rgba(0, 0, 0, 0.05)"; // pequeña transparencia para borrar caracteres anteriores
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#0F0"; // color verde clásico
  ctx.font = fontSize + "px monospace";

  for (let i = 0; i < drops.length; i++) {
    const text = letters[Math.floor(Math.random() * letters.length)];
    ctx.fillText(text, i * fontSize, drops[i] * fontSize);

    // Nueva posición o reinicio
    drops[i]++;
    if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
      drops[i] = 0;
    }
  }

  animationId = requestAnimationFrame(drawMatrix);
}

// Funciones de control de audio
playBtn.addEventListener("click", () => {
  if (audio.paused) {
    audio.play();
    if (!matrixRunning) {
      drawMatrix();
      matrixRunning = true;
    }
  } else {
    audio.pause();
    cancelAnimationFrame(animationId);
    matrixRunning = false;
  }
});

stopBtn.addEventListener("click", () => {
  audio.pause();
  audio.currentTime = 0;
  cancelAnimationFrame(animationId);
  matrixRunning = false;
  progress.style.width = "0%";
  timeDisplay.textContent = "00:00";
});

muteBtn.addEventListener("click", () => {
  audio.muted = !audio.muted;
  muteBtn.classList.toggle("active", audio.muted);
});

// Actualizar barra de progreso y tiempo
audio.addEventListener("timeupdate", () => {
  const percent = (audio.currentTime / audio.duration) * 100 || 0;
  progress.style.width = percent + "%";

  const minutes = Math.floor(audio.currentTime / 60);
  const seconds = Math.floor(audio.currentTime % 60);
  timeDisplay.textContent = `${minutes.toString().padStart(2,"0")}:${seconds.toString().padStart(2,"0")}`;
});

// Barra interactiva
document.querySelector(".progress-container").addEventListener("click", (e) => {
  const rect = e.currentTarget.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const newTime = (x / rect.width) * audio.duration;
  audio.currentTime = newTime;
});
