const audio = new Audio("https://stream.zeno.fm/ezq3fcuf5ehvv");
audio.preload = "auto";

const playBtn = document.getElementById("play-btn");
const stopBtn = document.getElementById("stop-btn");
const muteBtn = document.getElementById("mute-btn");
const nowPlaying = document.getElementById("now-playing");

let matrixRunning = false;
const canvas = document.getElementById("matrix");
const ctx = canvas.getContext("2d");

canvas.width = canvas.offsetWidth;
canvas.height = canvas.offsetHeight;

const letters = "アァイィウヴエェオカガキギクケゲコゴサザシジスセゼソゾタダチヂッツヅテデトドナニヌネノハバパヒビピフヘベホボポマミムメモヤユヨラリルレロワンABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const fontSize = 16;
const columns = Math.floor(canvas.width / fontSize);
const drops = Array(columns).fill(1);

function drawMatrix() {
  ctx.fillStyle = "rgba(0, 0, 0, 0.08)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#0F0";
  ctx.font = fontSize + "px monospace";

  for (let i = 0; i < drops.length; i++) {
    const text = letters.charAt(Math.floor(Math.random() * letters.length));
    ctx.fillText(text, i * fontSize, drops[i] * fontSize);

    if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
      drops[i] = 0;
    }
    drops[i]++;
  }
}

let matrixInterval;

// 🔹 Play/Pause
playBtn.addEventListener("click", () => {
  if (audio.paused) {
    audio.play();
    playBtn.textContent = "⏸"; // Cambia a pausa
    if (!matrixRunning) {
      matrixInterval = setInterval(drawMatrix, 50);
      matrixRunning = true;
    }
  } else {
    audio.pause();
    playBtn.textContent = "▶"; // Vuelve a play
    clearInterval(matrixInterval);
    matrixRunning = false;
  }
});

// 🔹 Stop
stopBtn.addEventListener("click", () => {
  audio.pause();
  audio.currentTime = 0;
  playBtn.textContent = "▶";
  clearInterval(matrixInterval);
  matrixRunning = false;
});

// 🔹 Mute
muteBtn.addEventListener("click", () => {
  audio.muted = !audio.muted;
  muteBtn.textContent = audio.muted ? "🔊" : "🔇";
});

// 🔹 Metadatos
async function cargarMetadata() {
  try {
    const response = await fetch("https://stream.zeno.fm/ezq3fcuf5ehvv?json=1");
    const data = await response.json();
    if (data.artist && data.title) {
      nowPlaying.textContent = `${data.artist} - ${data.title}`;
    } else {
      nowPlaying.textContent = "Transmisión en vivo";
    }
  } catch (err) {
    nowPlaying.textContent = "Conectando...";
  }
}

setInterval(cargarMetadata, 10000);
cargarMetadata();
