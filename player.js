<script>
// ===============================
// REPRODUCTOR STREAMING + MATRIX
// ===============================

// ===== ELEMENTOS =====
const radioAudio = document.getElementById("radio-audio");
const playPauseBtn = document.getElementById("playPauseBtn");
const stopBtn = document.getElementById("stop-btn");
const muteBtn = document.getElementById("mute-btn");
const progress = document.getElementById("progress");
const timeDisplay = document.getElementById("time-display");
const nowPlaying = document.getElementById("now-playing");

let animationRunning = false;
let animationFrame;

// ===== PLAY/PAUSE =====
playPauseBtn.addEventListener("click", () => {
  if (radioAudio.paused) {
    radioAudio.play().then(() => {
      playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
      startMatrix();
    }).catch(err => {
      console.warn("iOS/Chrome bloqueó autoplay:", err);
    });
  } else {
    radioAudio.pause();
    playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
    stopMatrix();
  }
});

// ===== STOP =====
stopBtn.addEventListener("click", () => {
  radioAudio.pause();
  radioAudio.currentTime = 0;
  playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
  stopMatrix();
});

// ===== MUTE =====
muteBtn.addEventListener("click", () => {
  radioAudio.muted = !radioAudio.muted;
  muteBtn.innerHTML = radioAudio.muted 
    ? '<i class="fas fa-volume-mute"></i>' 
    : '<i class="fas fa-volume-up"></i>';
  muteBtn.style.color = radioAudio.muted ? '#ff0000' : '#ff6600';
});

// ===== BARRA DE PROGRESO + TIEMPO =====
radioAudio.addEventListener("timeupdate", () => {
  if (radioAudio.duration) {
    const percent = (radioAudio.currentTime / radioAudio.duration) * 100;
    progress.style.width = percent + "%";
  }

  const hrs = Math.floor(radioAudio.currentTime / 3600);
  const mins = Math.floor((radioAudio.currentTime % 3600) / 60);
  const secs = Math.floor(radioAudio.currentTime % 60);
  timeDisplay.textContent =
    `${hrs.toString().padStart(2,"0")}:${mins.toString().padStart(2,"0")}:${secs.toString().padStart(2,"0")}`;
});

// ===== ANIMACIÓN MATRIX =====
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
  ctx.fillStyle = "rgba(0,0,0,0.1)"; // deja estela difuminada
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.font = fontSize + "px monospace";

  for(let i=0; i<drops.length; i++){
    const text = chars[Math.floor(Math.random()*chars.length)];
    const x = i * fontSize;
    const y = drops[i] * fontSize;

    // cabeza brillante
    ctx.fillStyle = "rgba(0,255,0,1)";
    ctx.fillText(text, x, y);

    // cola difuminada
    ctx.fillStyle = "rgba(0,255,0,0.5)";
    ctx.fillText(text, x, y - fontSize);

    if (y > canvas.height && Math.random() > 0.975) {
      drops[i] = 0;
    }
    drops[i]++;
  }

  animationFrame = requestAnimationFrame(drawMatrix);
}

function startMatrix(){
  if (!animationRunning) {
    animationRunning = true;
    drawMatrix();
  }
}

function stopMatrix(){
  if (animationRunning) {
    cancelAnimationFrame(animationFrame);
    animationRunning = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
}
</script>
