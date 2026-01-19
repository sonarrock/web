// ===============================
// SONAR ROCK PLAYER + MATRIX
// ===============================

const audio = document.getElementById("radio-audio");
const playPauseBtn = document.getElementById("playPauseBtn");
const stopBtn = document.getElementById("stop-btn");
const muteBtn = document.getElementById("mute-btn");
const progress = document.getElementById("radio-progress");
const progressContainer = document.getElementById("radio-progress-container");
const timeDisplay = document.getElementById("time-display");
const player = document.querySelector(".player-container");

let animationRunning = false;
let animationFrame;

// --------------------
// PLAY / PAUSE
// --------------------
playPauseBtn.addEventListener("click", () => {
  if(audio.paused){
    audio.play().then(() => {
      playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
      player.classList.add("playing");
      startMatrix();
    }).catch(()=>{});
  } else {
    audio.pause();
    playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
    player.classList.remove("playing");
    stopMatrix();
  }
});

stopBtn.addEventListener("click", () => {
  audio.pause();
  audio.currentTime = 0;
  playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
  player.classList.remove("playing");
  stopMatrix();
});

muteBtn.addEventListener("click", () => {
  audio.muted = !audio.muted;
  muteBtn.innerHTML = audio.muted
    ? '<i class="fas fa-volume-mute"></i>'
    : '<i class="fas fa-volume-up"></i>';
  muteBtn.style.color = audio.muted ? "#ff0000" : "#ff6600";
});

// --------------------
// PROGRESO / TIEMPO
// --------------------
audio.addEventListener("timeupdate", () => {
  if(audio.duration){
    progress.style.width = (audio.currentTime / audio.duration * 100) + "%";
  }
  const h = Math.floor(audio.currentTime/3600);
  const m = Math.floor((audio.currentTime%3600)/60);
  const s = Math.floor(audio.currentTime%60);
  timeDisplay.textContent =
    `${h.toString().padStart(2,"0")}:${m.toString().padStart(2,"0")}:${s.toString().padStart(2,"0")}`;
});

progressContainer.addEventListener("click", e => {
  const rect = progressContainer.getBoundingClientRect();
  audio.currentTime = ((e.clientX - rect.left) / rect.width) * audio.duration;
});

// ===============================
// MATRIX AZUL NEÓN + GRIS
// ===============================
const canvas = document.getElementById("matrixCanvas");
const ctx = canvas.getContext("2d");

let fontSize = 16;
let columns;
let drops = [];

const chars = "アァイィウヴエェオカガキギクグケゲコゴabcdefghijklmnopqrstuvwxyz0123456789".split("");
const colors = ["#00eaff", "#00bcd4", "#9e9e9e", "#607d8b"];

function resizeCanvas(){
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
  columns = Math.floor(canvas.width / fontSize);
  drops = Array(columns).fill(1);
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

function drawMatrix(){
  ctx.fillStyle = "rgba(0,0,0,0.18)";
  ctx.fillRect(0,0,canvas.width,canvas.height);

  ctx.font = fontSize + "px monospace";
  ctx.shadowBlur = 12;
  ctx.shadowColor = "#00eaff";

  for(let i=0;i<drops.length;i++){
    const text = chars[Math.floor(Math.random()*chars.length)];
    const x = i * fontSize;
    const y = drops[i] * fontSize;

    ctx.fillStyle = colors[Math.floor(Math.random()*colors.length)];
    ctx.fillText(text,x,y);

    if(y > canvas.height && Math.random() > 0.975){
      drops[i] = 0;
    }
    drops[i]++;
  }
  animationFrame = requestAnimationFrame(drawMatrix);
}

function startMatrix(){
  if(!animationRunning){
    animationRunning = true;
    drawMatrix();
  }
}

function stopMatrix(){
  cancelAnimationFrame(animationFrame);
  animationRunning = false;
  ctx.clearRect(0,0,canvas.width,canvas.height);
}
