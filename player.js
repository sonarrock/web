const audio = document.getElementById("audio");
const playBtn = document.getElementById("play-btn");
const pauseBtn = document.getElementById("pause-btn");
const stopBtn = document.getElementById("stop-btn");
const muteBtn = document.getElementById("mute-btn");
const progress = document.getElementById("progress");
const timeDisplay = document.getElementById("time-display");
const matrix = document.getElementById("matrix");
let matrixInterval;

// CONTROLES
playBtn.addEventListener("click", () => {
  audio.play();
  runMatrix();
});
pauseBtn.addEventListener("click", () => {
  audio.pause();
  stopMatrix();
});
stopBtn.addEventListener("click", () => {
  audio.pause();
  audio.currentTime = 0;
  stopMatrix();
});
muteBtn.addEventListener("click", () => {
  audio.muted = !audio.muted;
  muteBtn.classList.toggle("active");
});

// BARRA DE PROGRESO
audio.addEventListener("timeupdate", () => {
  const percent = (audio.currentTime / audio.duration) * 100;
  progress.style.width = percent + "%";

  const minutes = Math.floor(audio.currentTime / 60);
  const seconds = Math.floor(audio.currentTime % 60);
  timeDisplay.textContent = `${minutes.toString().padStart(2,"0")}:${seconds.toString().padStart(2,"0")}`;
});

document.querySelector(".progress-container").addEventListener("click", (e) => {
  const rect = e.target.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const width = rect.width;
  audio.currentTime = (x / width) * audio.duration;
});

// MATRIX ANIMATION – Solo un carácter por posición
function runMatrix() {
  const ctx = matrix.getContext("2d");
  matrix.width = matrix.offsetWidth;
  matrix.height = matrix.offsetHeight;

  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ123456789@#$%^&*()*&^%";
  const fontSize = 16;
  const columns = Math.floor(matrix.width / fontSize);
  const drops = Array(columns).fill(0);

  function draw() {
    // Limpiar completamente el canvas cada frame
    ctx.clearRect(0, 0, matrix.width, matrix.height);

    ctx.fillStyle = "rgba(0,255,0,0.7)";
    ctx.font = fontSize + "px monospace";

    for (let i = 0; i < columns; i++) {
      const text = letters[Math.floor(Math.random() * letters.length)];
      drops[i] = 1; // Solo un carácter por columna
      ctx.fillText(text, i * fontSize, drops[i] * fontSize);
    }
  }

  if (!matrixInterval) matrixInterval = setInterval(draw, 100); // velocidad moderada
}

function stopMatrix() {
  clearInterval(matrixInterval);
  matrixInterval = null;
  const ctx = matrix.getContext("2d");
  ctx.clearRect(0,0,matrix.width,matrix.height);
}

