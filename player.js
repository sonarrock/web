// ===== Control de Audio =====
const audio = document.getElementById("audio");
const playBtn = document.getElementById("play-btn");
const pauseBtn = document.getElementById("pause-btn");
const muteBtn = document.getElementById("mute-btn");
const nowPlaying = document.getElementById("now-playing");

playBtn.addEventListener("click", () => audio.play());
pauseBtn.addEventListener("click", () => audio.pause());
muteBtn.addEventListener("click", () => {
  audio.muted = !audio.muted;
  muteBtn.textContent = audio.muted ? "🔊 Unmute" : "🔇 Mute";
});

// ===== Animación Matrix Code Rain =====
const canvas = document.getElementById("matrix");
const ctx = canvas.getContext("2d");

canvas.width = canvas.offsetWidth;
canvas.height = canvas.offsetHeight;

const letters = "アァイィウヴエェオカガキギクグケゲコゴサザシジスズセゼソゾタダチッヂツヅテデトドナニヌネノハバパヒビピフブプヘベペホボポマミムメモヤユヨラリルレロワヲンABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const lettersArr = letters.split("");

const fontSize = 14;
const columns = canvas.width / fontSize;
const drops = Array(Math.floor(columns)).fill(1);

function drawMatrix() {
  ctx.fillStyle = "rgba(0,0,0,0.1)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#0F0";
  ctx.font = fontSize + "px monospace";

  for (let i = 0; i < drops.length; i++) {
    const text = lettersArr[Math.floor(Math.random() * lettersArr.length)];
    ctx.fillText(text, i * fontSize, drops[i] * fontSize);

    if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
      drops[i] = 0;
    }
    drops[i]++;
  }
}
setInterval(drawMatrix, 50);

// ===== Metadatos desde Zeno.fm =====
async function cargarMetadata() {
  try {
    const response = await fetch("https://stream.zeno.fm/ezq3fcuf5ehvv?json=1");
    const data = await response.json();
    if (data.artist && data.title) {
      nowPlaying.textContent = `${data.artist} - ${data.title}`;
    } else if (data.title) {
      nowPlaying.textContent = data.title;
    } else {
      nowPlaying.textContent = "Transmitiendo en vivo...";
    }
  } catch (e) {
    nowPlaying.textContent = "Cargando canción...";
  }
}
setInterval(cargarMetadata, 10000);
cargarMetadata();

// Ajustar tamaño del canvas si la ventana cambia
window.addEventListener("resize", () => {
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
});
