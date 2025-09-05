const audio = document.getElementById("audio");
const playBtn = document.getElementById("play-btn");
const stopBtn = document.getElementById("stop-btn");
const muteBtn = document.getElementById("mute-btn");
const progressBar = document.getElementById("progress");
const timeDisplay = document.getElementById("time-display");

let matrixCanvas = document.getElementById("matrix");
let ctx = matrixCanvas.getContext("2d");
matrixCanvas.width = matrixCanvas.offsetWidth;
matrixCanvas.height = matrixCanvas.offsetHeight;

let animationFrame;
let columns = Math.floor(matrixCanvas.width / 20);
let drops = Array(columns).fill(1);

function drawMatrix() {
  ctx.fillStyle = "rgba(0,0,0,0.05)";
  ctx.fillRect(0, 0, matrixCanvas.width, matrixCanvas.height);

  ctx.fillStyle = "#0f0";
  ctx.font = "15px monospace";

  drops.forEach((y, x) => {
    let text = String.fromCharCode(0x30A0 + Math.random() * 96);
    ctx.fillText(text, x * 20, y * 20);

    if (y * 20 > matrixCanvas.height && Math.random() > 0.975) {
      drops[x] = 0;
    }
    drops[x]++;
  });

  animationFrame = requestAnimationFrame(drawMatrix);
}

function startMatrix() {
  if (!animationFrame) {
    drawMatrix();
  }
}

function stopMatrix() {
  cancelAnimationFrame(animationFrame);
  animationFrame = null;
  ctx.clearRect(0, 0, matrixCanvas.width, matrixCanvas.height);
}

// ▶ Play
playBtn.addEventListener("click", () => {
  audio.play();
  playBtn.innerHTML = '<i class="fas fa-pause"></i>';
  startMatrix();
});

// ⏸ Pause con el mismo botón
audio.addEventListener("pause", () => {
  playBtn.innerHTML = '<i class="fas fa-play"></i>';
  stopMatrix();
});

// ⏹ Stop
stopBtn.addEventListener("click", () => {
  audio.pause();
  audio.currentTime = 0;
  stopMatrix();
  playBtn.innerHTML = '<i class="fas fa-play"></i>';
});

// 🔇 Mute (NO afecta Matrix)
muteBtn.addEventListener("click", () => {
  audio.muted = !audio.muted;
  muteBtn.classList.toggle("active");
});

// Barra de progreso
audio.addEventListener("timeupdate", () => {
  let progress = (audio.currentTime / audio.duration) * 100;
  progressBar.style.width = progress + "%";

  let mins = Math.floor(audio.currentTime / 60);
  let secs = Math.floor(audio.currentTime % 60).toString().padStart(2, "0");
  timeDisplay.textContent = `${mins}:${secs}`;
});
