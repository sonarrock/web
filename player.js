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

const letters = "アカサタナハマヤラワイウエオabcdefghijklmnopqrstuvwxyz0123456789";
const fontSize = 20;
const columns = Math.floor(canvas.width / fontSize);

// Cada columna mantiene su historial de caracteres y opacidades
const drops = [];
for (let i = 0; i < columns; i++) {
  drops[i] = [];
}

// Función de dibujo con estelas
function drawMatrix() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < drops.length; i++) {
    // Agregar nuevo carácter iluminado al principio
    const char = letters[Math.floor(Math.random() * letters.length)];
    drops[i].unshift({ char: char, opacity: 1.0 });

    // Limitar la longitud de la columna
    if (drops[i].length > 30) drops[i].pop();

    // Dibujar todos los caracteres de la columna
    for (let j = 0; j < drops[i].length; j++) {
      const y = j * fontSize;
      ctx.fillStyle = `rgba(0,255,0,${drops[i][j].opacity})`;
      ctx.font = `${fontSize}px monospace`;
      ctx.fillText(drops[i][j].char, i * fontSize, y);
      drops[i][j].opacity *= 0.9; // desvanecimiento gradual
    }
  }

  animationId = requestAnimationFrame(drawMatrix);
}

// Control de audio y animación
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

// Barra de progreso y contador
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
