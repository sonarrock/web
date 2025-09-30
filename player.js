// ===============================
// REPRODUCTOR STREAMING ZENO + MATRIX
// ===============================

// ----- ELEMENTOS -----
const audioStream = document.getElementById("radio-audio");
const playPauseBtn = document.getElementById("playPauseBtn");
const stopBtn = document.getElementById("stop-btn");
const muteBtn = document.getElementById("mute-btn");
const progressStream = document.getElementById("radio-progress");
const progressContainerStream = document.getElementById("radio-progress-container");
const timeDisplay = document.getElementById("time-display");
const nowPlaying = document.getElementById("now-playing");

let animationRunning = false;
let animationFrame;

// ----- PLAY / PAUSE -----
playPauseBtn.addEventListener("click", () => {
  if(audioStream.paused){
    audioStream.play().then(() => {
      playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
      startMatrix();
    }).catch(err => {
      console.warn("iOS/Chrome bloqueó autoplay:", err);
    });
  } else {
    audioStream.pause();
    playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
    stopMatrix();
  }
});

// ----- STOP -----
stopBtn.addEventListener("click", () => {
  audioStream.pause();
  audioStream.currentTime = 0;
  playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
  stopMatrix();
});

// ----- MUTE -----
muteBtn.addEventListener("click", () => {
  audioStream.muted = !audioStream.muted;
  muteBtn.innerHTML = audioStream.muted ? '<i class="fas fa-volume-mute"></i>' : '<i class="fas fa-volume-up"></i>';
  muteBtn.style.color = audioStream.muted ? '#ff0000' : '#ff6600';
});

// ----- BARRA DE PROGRESO + TIEMPO -----
audioStream.addEventListener("timeupdate", () => {
  if(audioStream.duration){
    const percent = (audioStream.currentTime / audioStream.duration) * 100;
    progressStream.style.width = percent + "%";
  }

  const hrs = Math.floor(audioStream.currentTime / 3600);
  const mins = Math.floor((audioStream.currentTime % 3600) / 60);
  const secs = Math.floor(audioStream.currentTime % 60);
  timeDisplay.textContent = `${hrs.toString().padStart(2,"0")}:${mins.toString().padStart(2,"0")}:${secs.toString().padStart(2,"0")}`;
});

// ----- CLICK EN PROGRESO -----
progressContainerStream.addEventListener('click', (e) => {
  const rect = progressContainerStream.getBoundingClientRect();
  const offsetX = e.clientX - rect.left;
  const width = rect.width;
  audioStream.currentTime = (offsetX / width) * audioStream.duration;
});

// ----- ANIMACIÓN MATRIX -----
const canvas = document.getElementById("matrixCanvas");
const ctx = canvas.getContext("2d");
let columns, drops, fontSize = 16;

function resizeCanvas(){
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
  columns = Math.floor(canvas.width / fontSize);
  drops = Array(columns).fill(1);
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

const chars = "アァイィウヴエェオカガキギクグケゲコゴサザシジスズセゼソゾタダチヂッツヅテデトドナニヌネノハバパヒビピフブプヘベペホボポマミムメモヤャユュヨラリルレロワヰヱヲンabcdefghijklmnopqrstuvwxyz0123456789".split("");

function drawMatrix(){
  ctx.fillStyle = "rgba(0,0,0,0.1)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.font = fontSize + "px monospace";

  for(let i=0; i<drops.length; i++){
    const text = chars[Math.floor(Math.random()*chars.length)];
    const x = i * fontSize;
    const y = drops[i] * fontSize;

    // cabeza brillante
    ctx.fillStyle = "rgba(0,255,0,1)";
    ctx.fillText(text, x, y);
}
