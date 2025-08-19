// ==== Reproductor Sonar Rock ====
// URL de tu streaming en Zeno
const streamUrl = "https://stream.zeno.fm/ezq3fcuf5ehvv"; // <-- cámbialo por tu enlace real

const container = document.getElementById("sonar-player");
container.innerHTML = `
  <div class="status">🔴 En Vivo</div>
  <canvas id="visualizer"></canvas>
  <div class="controls">
    <span class="time" id="current-time">00:00</span>
    <button id="play-btn">▶</button>
    <span class="time" id="total-time">LIVE</span>
  </div>
  <input type="range" id="volume" min="0" max="1" step="0.01" value="1">
`;

const audio = new Audio(streamUrl);
audio.crossOrigin = "anonymous";
let isPlaying = false;

const playBtn = document.getElementById("play-btn");
const volumeSlider = document.getElementById("volume");
const canvas = document.getElementById("visualizer");
const ctx = canvas.getContext("2d");

playBtn.addEventListener("click", () => {
  if (!isPlaying) {
    audio.play();
    isPlaying = true;
    playBtn.textContent = "⏸";
  } else {
    audio.pause();
    isPlaying = false;
    playBtn.textContent = "▶";
  }
});

volumeSlider.addEventListener("input", () => {
  audio.volume = volumeSlider.value;
});

// ==== Visualizador de ondas ====
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const analyser = audioCtx.createAnalyser();
const source = audioCtx.createMediaElementSource(audio);
source.connect(analyser);
analyser.connect(audioCtx.destination);
analyser.fftSize = 256;

const bufferLength = analyser.frequencyBinCount;
const dataArray = new Uint8Array(bufferLength);

function draw() {
  requestAnimationFrame(draw);
  analyser.getByteFrequencyData(dataArray);

  ctx.fillStyle = "#141414";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const barWidth = (canvas.width / bufferLength) * 2.5;
  let x = 0;

  for (let i = 0; i < bufferLength; i++) {
    const barHeight = dataArray[i] / 2;
    ctx.fillStyle = "#ff6600";
    ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
    x += barWidth + 1;
  }
}
draw();

// ==== Ajuste responsivo ====
function resizeCanvas() {
  canvas.width = container.clientWidth - 40; // padding
  canvas.height = 80;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();
