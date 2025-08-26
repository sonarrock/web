// Audio player
const audio = document.getElementById("audio");
const playBtn = document.getElementById("play-btn");
const stopBtn = document.getElementById("stop-btn");
const muteBtn = document.getElementById("mute-btn");
const nowPlaying = document.getElementById("now-playing");

let isPlaying = false;

// Play / Pause toggle
playBtn.addEventListener("click", () => {
  if (!isPlaying) {
    audio.play();
    playBtn.textContent = "⏸ Pause";
    isPlaying = true;
  } else {
    audio.pause();
    playBtn.textContent = "▶ Play";
    isPlaying = false;
  }
});

// Stop
stopBtn.addEventListener("click", () => {
  audio.pause();
  audio.currentTime = 0;
  playBtn.textContent = "▶ Play";
  isPlaying = false;
});

// Mute
muteBtn.addEventListener("click", () => {
  audio.muted = !audio.muted;
  muteBtn.textContent = audio.muted ? "🔊 Unmute" : "🔇 Mute";
});

// Metadata fetch
async function loadMetadata() {
  try {
    const res = await fetch("https://stream.zeno.fm/ezq3fcuf5ehvv?json=1");
    const data = await res.json();
    if (data.title) {
      nowPlaying.textContent = `${data.artist || ""} - ${data.title}`;
    }
  } catch {
    nowPlaying.textContent = "No se pudo cargar la canción";
  }
}
setInterval(loadMetadata, 10000);
loadMetadata();

// Matrix Animation
const canvas = document.getElementById("matrix");
const ctx = canvas.getContext("2d");

function resizeCanvas() {
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
}
resizeCanvas();

const letters = "アイウエオカキクケコサシスセソ0123456789".split("");
const fontSize = 14;
let columns = Math.floor(canvas.width / fontSize);
let drops = Array(columns).fill(1);

function draw() {
  ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#0f0";
  ctx.font = fontSize + "px monospace";

  for (let i = 0; i < drops.length; i++) {
    const text = letters[Math.floor(Math.random() * letters.length)];
    ctx.fillText(text, i * fontSize, drops[i] * fontSize);

    if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
      drops[i] = 0;
    }
    drops[i]++;
  }
}

setInterval(draw, 50);

// Ajustar animación al redimensionar
window.addEventListener("resize", () => {
  resizeCanvas();
  columns = Math.floor(canvas.width / fontSize);
  drops = Array(columns).fill(1);
});
