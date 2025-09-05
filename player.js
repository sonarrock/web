// ================== PLAYER ==================
const audio = document.getElementById("audio");
const playBtn = document.getElementById("play-btn");
const stopBtn = document.getElementById("stop-btn");
const muteBtn = document.getElementById("mute-btn");
const progressContainer = document.querySelector(".progress-container");
const progressBar = document.getElementById("progress");
const timeDisplay = document.getElementById("time-display");
const nowPlaying = document.getElementById("now-playing");

let isPlaying = false;
let isLive = true; // streaming en vivo
let matrixInterval;

// ================== MATRIX ==================
const canvas = document.getElementById("matrix");
const ctx = canvas.getContext("2d");

function resizeCanvas() {
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

const characters = "アカサタナハマヤラワABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
let fontSize = 14;
let columns = canvas.width / fontSize;
let drops = [];
for (let x = 0; x < columns; x++) drops[x] = Math.floor(Math.random() * canvas.height / fontSize);

function drawMatrix() {
  ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#0F0";
  ctx.font = fontSize + "px monospace";

  for (let i = 0; i < drops.length; i++) {
    const text = characters.charAt(Math.floor(Math.random() * characters.length));
    ctx.fillText(text, i * fontSize, drops[i] * fontSize);
    drops[i]++;
    if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) drops[i] = 0;
  }
}

function startMatrix() {
  if (!matrixInterval) {
    matrixInterval = setInterval(drawMatrix, 50);
  }
}

function stopMatrix() {
  clearInterval(matrixInterval);
  matrixInterval = null;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// ================== BOTONES ==================
playBtn.addEventListener("click", () => {
  if (!isPlaying) {
    audio.play();
    isPlaying = true;
    playBtn.innerHTML = '<i class="fas fa-pause"></i>';
    startMatrix();
  } else {
    audio.pause();
    isPlaying = false;
    playBtn.innerHTML = '<i class="fas fa-play"></i>';
    stopMatrix();
  }
});

stopBtn.addEventListener("click", () => {
  audio.pause();
  audio.currentTime = 0;
  isPlaying = false;
  playBtn.innerHTML = '<i class="fas fa-play"></i>';
  updateProgress();
  stopMatrix();
});

muteBtn.addEventListener("click", () => {
  audio.muted = !audio.muted;
  muteBtn.classList.toggle("muted", audio.muted);
});

// ================== PROGRESO ==================
function updateProgress() {
  let percent;
  let currentTime = audio.currentTime;
  let duration = audio.duration;

  if (!isLive && !isNaN(duration)) {
    percent = (currentTime / duration) * 100;
    timeDisplay.textContent = formatTime(currentTime) + " / " + formatTime(duration);
  } else {
    percent = (currentTime / 600) * 100; // solo referencia en vivo
    timeDisplay.textContent = formatTime(currentTime);
  }
  progressBar.style.width = percent + "%";
}

function formatTime(sec) {
  let minutes = Math.floor(sec / 60);
  let seconds = Math.floor(sec % 60);
  return `${minutes < 10 ? "0" + minutes : minutes}:${seconds < 10 ? "0" + seconds : seconds}`;
}

audio.addEventListener("timeupdate", updateProgress);

// ================== BARRA INTERACTIVA ==================
progressContainer.addEventListener("click", (e) => {
  if (!isLive && audio.duration) {
    const rect = progressContainer.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    audio.currentTime = (clickX / rect.width) * audio.duration;
  }
});
