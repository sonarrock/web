/* ===============================
   ELEMENTOS
=============================== */
const audio = document.getElementById("radio-audio");
audio.crossOrigin = "anonymous";

const playPauseBtn = document.getElementById("playPauseBtn");
const stopBtn = document.getElementById("stop-btn");
const muteBtn = document.getElementById("mute-btn");
const timeDisplay = document.getElementById("time-display");
const matrixCanvas = document.getElementById("matrixCanvas");
const spectrumCanvas = document.getElementById("spectrumCanvas");
const liveIndicator = document.getElementById("live-indicator");
const player = document.querySelector(".player-container");
const liveText = liveIndicator?.querySelector(".text");

if (!audio || !player) {
  console.error("❌ Player incompleto");
  throw new Error("Player incompleto");
}

/* ===============================
   ESTADO
=============================== */
let audioCtx = null;
let analyser = null;
let source = null;
let animationId = null;
let startTime = null;
let lastGlow = 0.35;

/* ===============================
   CANVAS CONTEXTS
=============================== */
const matrixCtx = matrixCanvas.getContext("2d");
const spectrumCtx = spectrumCanvas.getContext("2d");

/* ===============================
   RESIZE CANVAS
=============================== */
function resizeCanvas() {
  const rect = player.getBoundingClientRect();

  matrixCanvas.width = rect.width;
  matrixCanvas.height = rect.height;

  spectrumCanvas.width = rect.width * 0.9;
  spectrumCanvas.height = 110;

  initMatrix();
}

window.addEventListener("resize", resizeCanvas);
window.addEventListener("orientationchange", resizeCanvas);
resizeCanvas();

/* ===============================
   AUDIO CONTEXT (CHROME SAFE)
=============================== */
function initAudioContext() {
  if (audioCtx) return;

  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  analyser = audioCtx.createAnalyser();
  analyser.fftSize = 256;
  analyser.smoothingTimeConstant = 0.8;

  source = audioCtx.createMediaElementSource(audio);
  source.connect(analyser);
  analyser.connect(audioCtx.destination);
}

/* ===============================
   PLAY / PAUSE
=============================== */
playPauseBtn.addEventListener("click", async () => {
  initAudioContext();

  if (audioCtx.state === "suspended") {
    await audioCtx.resume();
  }

  if (audio.paused) {
    await audio.play();

    player.classList.add("playing");
    playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
    liveIndicator.classList.add("live");

    if (!startTime) startTime = Date.now();
    animate();
  } else {
    audio.pause();
    playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
    player.style.setProperty("--glow-intensity", 0.3);
    cancelAnimationFrame(animationId);
  }
});

/* ===============================
   STOP
=============================== */
stopBtn.addEventListener("click", () => {
  audio.pause();
  audio.currentTime = 0;

  playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
  player.classList.remove("playing");
  player.style.setProperty("--glow-intensity", 0.25);

  cancelAnimationFrame(animationId);
  startTime = null;
});

/* ===============================
   MUTE
=============================== */
muteBtn.addEventListener("click", () => {
  audio.muted = !audio.muted;
  muteBtn.innerHTML = audio.muted
    ? '<i class="fas fa-volume-mute"></i>'
    : '<i class="fas fa-volume-up"></i>';
});

/* ===============================
   TIME DISPLAY
=============================== */
setInterval(() => {
  if (!startTime) return;

  const elapsed = Math.floor((Date.now() - startTime) / 1000);
  const hrs = String(Math.floor(elapsed / 3600)).padStart(2, "0");
  const mins = String(Math.floor((elapsed % 3600) / 60)).padStart(2, "0");
  const secs = String(elapsed % 60).padStart(2, "0");

  timeDisplay.textContent = `${hrs}:${mins}:${secs}`;
}, 1000);

/* ===============================
   GLOW DINÁMICO
=============================== */
function updateGlow(dataArray) {
  let sum = 0;
  for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];

  const avg = sum / dataArray.length;
  const target = Math.min(Math.max(avg / 160, 0.25), 1);

  lastGlow = lastGlow * 0.75 + target * 0.25;
  player.style.setProperty("--glow-intensity", lastGlow.toFixed(2));
}

/* ===============================
   SPECTRUM
=============================== */
function drawSpectrum() {
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);

  analyser.getByteFrequencyData(dataArray);
  updateGlow(dataArray);

  spectrumCtx.clearRect(0, 0, spectrumCanvas.width, spectrumCanvas.height);

  const barWidth = spectrumCanvas.width / bufferLength;
  let x = 0;

  for (let i = 0; i < bufferLength; i++) {
    const barHeight = dataArray[i] * 0.7;

    spectrumCtx.fillStyle = "#ff6600";
    spectrumCtx.fillRect(
      x,
      spectrumCanvas.height - barHeight,
      barWidth - 1,
      barHeight
    );

    x += barWidth;
  }
}

/* ===============================
   MATRIX
=============================== */
const matrixChars = "SONARROCK101010";
const fontSize = 14;
let matrixDrops = [];

function initMatrix() {
  const cols = Math.floor(matrixCanvas.width / fontSize);
  matrixDrops = Array(cols).fill(1);
}

function drawMatrix() {
  matrixCtx.fillStyle = "rgba(0,0,0,0.08)";
  matrixCtx.fillRect(0, 0, matrixCanvas.width, matrixCanvas.height);

  matrixCtx.fillStyle = "#ff6600";
  matrixCtx.font = `${fontSize}px monospace`;

  matrixDrops.forEach((y, i) => {
    const char = matrixChars[Math.floor(Math.random() * matrixChars.length)];
    const x = i * fontSize;

    matrixCtx.fillText(char, x, y * fontSize);

    if (y * fontSize > matrixCanvas.height && Math.random() > 0.97) {
      matrixDrops[i] = 0;
    }
    matrixDrops[i]++;
  });
}

/* ===============================
   LOOP
=============================== */
function animate() {
  if (!analyser) return;

  drawSpectrum();
  drawMatrix();

  animationId = requestAnimationFrame(animate);
}
