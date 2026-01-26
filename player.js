/* ===============================
   ELEMENTOS
=============================== */
const audio = document.getElementById("radio-audio");
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
let audioCtx;
let analyser;
let source;
let animationId;
let startTime = null;
let lastGlow = 0.35;

/* ===============================
   CANVAS CONTEXTS
=============================== */
const matrixCtx = matrixCanvas.getContext("2d");
const spectrumCtx = spectrumCanvas.getContext("2d");

/* ===============================
   RESIZE CANVAS (CRÍTICO)
=============================== */
function resizeCanvas() {
  const rect = player.getBoundingClientRect();

  matrixCanvas.width = rect.width;
  matrixCanvas.height = rect.height;

  spectrumCanvas.width = rect.width * 0.9;
  spectrumCanvas.height = 110;
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);
window.addEventListener("orientationchange", resizeCanvas);

/* ===============================
   AUDIO CONTEXT
=============================== */
function initAudioContext() {
  if (audioCtx) return;

  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  analyser = audioCtx.createAnalyser();
  analyser.fftSize = 256;

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
    audio.play();
    player.classList.add("playing");
    playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
    liveIndicator.classList.add("live");
    if (!startTime) startTime = Date.now();
    animate();
  } else {
    audio.pause();
    playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
    player.style.setProperty("--glow-intensity", 0.35);
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
   TIME DISPLAY (SIMULADO STREAM)
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
  for (let i = 0; i < dataArray.length; i++) {
    sum += dataArray[i];
  }

  const average = sum / dataArray.length;
  const target = Math.min(Math.max(average / 180, 0.25), 1);

  // suavizado analógico
  lastGlow = lastGlow * 0.8 + target * 0.2;

  player.style.setProperty("--glow-intensity", lastGlow.toFixed(2));
}

/* ===============================
   SPECTRUM VISUALIZER
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
    const barHeight = dataArray[i] / 1.8;

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
   MATRIX EFFECT (LIGERO)
=============================== */
const matrixChars = "SONARROCK101010";
const fontSize = 14;
let matrixDrops = [];

function initMatrix() {
  const columns = Math.floor(matrixCanvas.width / fontSize);
  matrixDrops = Array(columns).fill(1);
}

initMatrix();

function drawMatrix() {
  matrixCtx.fillStyle = "rgba(0,0,0,0.08)";
  matrixCtx.fillRect(0, 0, matrixCanvas.width, matrixCanvas.height);

  matrixCtx.fillStyle = "#ff6600";
  matrixCtx.font = `${fontSize}px monospace`;

  matrixDrops.forEach((y, i) => {
    const text = matrixChars[Math.floor(Math.random() * matrixChars.length)];
    const x = i * fontSize;

    matrixCtx.fillText(text, x, y * fontSize);

    if (y * fontSize > matrixCanvas.height && Math.random() > 0.975) {
      matrixDrops[i] = 0;
    }
    matrixDrops[i]++;
  });
}

/* ===============================
   ANIMATION LOOP
=============================== */
function animate() {
  if (!analyser) return;

  drawSpectrum();
  drawMatrix();

  animationId = requestAnimationFrame(animate);
}
