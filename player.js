const audio = document.getElementById("audio");
const playBtn = document.getElementById("play-btn");
const stopBtn = document.getElementById("stop-btn");
const muteBtn = document.getElementById("mute-btn");
const progress = document.getElementById("progress");
const progressContainer = document.querySelector(".progress-container");
const timeDisplay = document.getElementById("time-display");

let matrixCanvas = document.getElementById("matrix");
let ctx = matrixCanvas.getContext("2d");
let animationId;
let matrixActive = false;

function resizeMatrix() {
  matrixCanvas.width = matrixCanvas.offsetWidth;
  matrixCanvas.height = matrixCanvas.offsetHeight;
}
window.addEventListener("resize", resizeMatrix);
resizeMatrix();

const letters = "アァイィウヴエェオカガキギクグケゲコゴサザシジスズセゼソゾタダチヂツヅテデトドナニヌネノハバパヒビピフブプヘベペホボポマミムメモヤユヨラリルレロワヲン";
const lettersArr = letters.split("");
let fontSize = 14;
let columns = matrixCanvas.width / fontSize;
let drops = Array(Math.floor(columns)).fill(1);

function drawMatrix() {
  ctx.fillStyle = "rgba(0,0,0,0.1)";
  ctx.fillRect(0, 0, matrixCanvas.width, matrixCanvas.height);
  ctx.fillStyle = "#0F0";
  ctx.font = fontSize + "px monospace";

  for (let i = 0; i < drops.length; i++) {
    let text = lettersArr[Math.floor(Math.random() * lettersArr.length)];
    ctx.fillText(text, i * fontSize, drops[i] * fontSize);

    if (drops[i] * fontSize > matrixCanvas.height && Math.random() > 0.975) {
      drops[i] = 0;
    }
    drops[i]++;
  }
}

function startMatrix() {
  if (!matrixActive) {
    matrixActive = true;
    function animate() {
      drawMatrix();
      animationId = requestAnimationFrame(animate);
    }
    animate();
  }
}
function stopMatrix() {
  matrixActive = false;
  cancelAnimationFrame(animationId);
  ctx.clearRect(0, 0, matrixCanvas.width, matrixCanvas.height);
}

// --- Controles ---
playBtn.addEventListener("click", () => {
  if (audio.paused) {
    audio.play();
    playBtn.innerHTML = '<i class="fas fa-pause"></i>';
    startMatrix();
  } else {
    audio.pause();
    playBtn.innerHTML = '<i class="fas fa-play"></i>';
    stopMatrix();
  }
});

stopBtn.addEventListener("click", () => {
  audio.pause();
  audio.currentTime = 0;
  playBtn.innerHTML = '<i class="fas fa-play"></i>';
  stopMatrix();
});

muteBtn.addEventListener("click", () => {
  audio.muted = !audio.muted;
  muteBtn.classList.toggle("muted", audio.muted);
});

// Progreso
audio.addEventListener("timeupdate", () => {
  if (audio.duration) {
    const percent = (audio.currentTime / audio.duration) * 100;
    progress.style.width = percent + "%";
  }
  let minutes = Math.floor(audio.currentTime / 60);
  let seconds = Math.floor(audio.currentTime % 60);
  if (seconds < 10) seconds = "0" + seconds;
  timeDisplay.textContent = `${minutes}:${seconds}`;
});

progressContainer.addEventListener("click", (e) => {
  const width = progressContainer.clientWidth;
  const clickX = e.offsetX;
  if (audio.duration) {
    audio.currentTime = (clickX / width) * audio.duration;
  }
});
