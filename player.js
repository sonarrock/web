/* ===============================
   ELEMENTOS
=============================== */
const audio = document.getElementById("radio-audio");
const playPauseBtn = document.getElementById("playPauseBtn");
const stopBtn = document.getElementById("stop-btn");
const muteBtn = document.getElementById("mute-btn");
const timeDisplay = document.getElementById("time-display");
const spectrumCanvas = document.getElementById("spectrumCanvas");
const matrixCanvas = document.getElementById("matrixCanvas");
const player = document.querySelector(".player-container");
const liveIndicator = document.getElementById("live-indicator");

const STREAM_URL = "https://stream.zeno.fm/ezq3fcuf5ehvv";

/* ===============================
   ESTADO
=============================== */
let playing = false;
let animationId = null;
let startTime = null;
let fakeLevel = 0.3;

/* ===============================
   CANVAS
=============================== */
const spectrumCtx = spectrumCanvas.getContext("2d");
const matrixCtx = matrixCanvas.getContext("2d");

/* ===============================
   RESIZE
=============================== */
function resize() {
  const r = player.getBoundingClientRect();
  spectrumCanvas.width = r.width * 0.9;
  spectrumCanvas.height = 90;
  matrixCanvas.width = r.width;
  matrixCanvas.height = r.height;
  initMatrix();
}
window.addEventListener("resize", resize);
resize();

/* ===============================
   PLAY
=============================== */
playPauseBtn.addEventListener("click", () => {
  if (!audio.src) audio.src = STREAM_URL;

  if (!playing) {
    audio.play().then(() => {
      playing = true;
      player.classList.add("playing");
      liveIndicator.classList.add("live");
      playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
      startTime = Date.now();
      animate();
    }).catch(e => {
      console.error("Chrome bloqueó:", e);
    });
  } else {
    audio.pause();
    playing = false;
    playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
    cancelAnimationFrame(animationId);
  }
});

/* ===============================
   STOP
=============================== */
stopBtn.addEventListener("click", () => {
  audio.pause();
  audio.removeAttribute("src");
  audio.load();
  playing = false;
  startTime = null;
  player.classList.remove("playing");
  playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
  cancelAnimationFrame(animationId);
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
   TIME
=============================== */
setInterval(() => {
  if (!startTime) return;
  const t = Math.floor((Date.now() - startTime) / 1000);
  timeDisplay.textContent =
    `${String(Math.floor(t / 3600)).padStart(2,"0")}:` +
    `${String(Math.floor((t % 3600) / 60)).padStart(2,"0")}:` +
    `${String(t % 60).padStart(2,"0")}`;
}, 1000);

/* ===============================
   FAKE SPECTRUM (CHROME SAFE)
=============================== */
function drawFakeSpectrum() {
  spectrumCtx.clearRect(0, 0, spectrumCanvas.width, spectrumCanvas.height);
  const bars = 32;
  const w = spectrumCanvas.width / bars;

  fakeLevel += (Math.random() - 0.5) * 0.15;
  fakeLevel = Math.max(0.2, Math.min(fakeLevel, 1));

  player.style.setProperty("--glow-intensity", fakeLevel.toFixed(2));

  for (let i = 0; i < bars; i++) {
    const h = spectrumCanvas.height * fakeLevel * Math.random();
    spectrumCtx.fillStyle = "#ff6600";
    spectrumCtx.fillRect(
      i * w,
      spectrumCanvas.height - h,
      w - 2,
      h
    );
  }
}

/* ===============================
   MATRIX
=============================== */
const chars = "SONARROCK101010";
const size = 14;
let drops = [];

function initMatrix() {
  drops = Array(Math.floor(matrixCanvas.width / size)).fill(1);
}

function drawMatrix() {
  matrixCtx.fillStyle = "rgba(0,0,0,0.08)";
  matrixCtx.fillRect(0,0,matrixCanvas.width,matrixCanvas.height);
  matrixCtx.fillStyle = "#ff6600";
  matrixCtx.font = `${size}px monospace`;

  drops.forEach((y,i) => {
    const c = chars[Math.floor(Math.random()*chars.length)];
    matrixCtx.fillText(c, i*size, y*size);
    if (y*size > matrixCanvas.height && Math.random()>0.97) drops[i]=0;
    drops[i]++;
  });
}

/* ===============================
   LOOP
=============================== */
function animate() {
  drawFakeSpectrum();
  drawMatrix();
  animationId = requestAnimationFrame(animate);
}
