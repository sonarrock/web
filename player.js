// Audio
const audio = document.getElementById("audio");
const playBtn = document.getElementById("play-btn");
const stopBtn = document.getElementById("stop-btn");
const muteBtn = document.getElementById("mute-btn");

let isPlaying = false;

// Play / Pause
playBtn.addEventListener("click", () => {
  if (!isPlaying) {
    audio.play().then(() => {
      isPlaying = true;
      playBtn.innerHTML = '<i class="fas fa-pause"></i>';
    }).catch(err => console.log("Error al reproducir:", err));
  } else {
    audio.pause();
    isPlaying = false;
    playBtn.innerHTML = '<i class="fas fa-play"></i>';
  }
});

// Stop
stopBtn.addEventListener("click", () => {
  audio.pause();
  audio.currentTime = 0;
  isPlaying = false;
  playBtn.innerHTML = '<i class="fas fa-play"></i>';
});

// Mute / Unmute
muteBtn.addEventListener("click", () => {
  audio.muted = !audio.muted;
  muteBtn.innerHTML = audio.muted
    ? '<i class="fas fa-volume-up"></i>'
    : '<i class="fas fa-volume-mute"></i>';
});

// ===== Matrix Animation =====
const canvas = document.getElementById("matrix");
const ctx = canvas.getContext("2d");

function resizeCanvas() {
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

const letters = "アァイィウヴエェオカガキギクグケゲコゴサザシジスズセゼソゾタダチヂッツヅテデトドナニヌネノハバパヒビピフブプヘベペホボポマミムメモヤャユュヨラリルレロワヰヱヲンABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const fontSize = 14;
let columns = canvas.width / fontSize;
let drops = Array(Math.floor(columns)).fill(1);

function drawMatrix() {
  ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#0F0";
  ctx.font = fontSize + "px monospace";

  drops.forEach((y, i) => {
    const text = letters[Math.floor(Math.random() * letters.length)];
    const x = i * fontSize;
    ctx.fillText(text, x, y * fontSize);

    if (y * fontSize > canvas.height && Math.random() > 0.975) {
      drops[i] = 0;
    }
    drops[i]++;
  });
}

setInterval(drawMatrix, 50);
