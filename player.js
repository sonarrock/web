// Selección de elementos
const audio = document.getElementById('cancion');
const playBtn = document.getElementById('play-btn');
const pauseBtn = document.getElementById('pause-btn');
const muteBtn = document.getElementById('mute-btn');
const canvas = document.getElementById('visualizer');
const ctx = canvas.getContext('2d');

let audioCtx, analyser, source, dataArray, bufferLength;
let animationId;

// Inicializa AudioContext y visualizador, solo al primer click
function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioCtx.createAnalyser();
    source = audioCtx.createMediaElementSource(audio);
    source.connect(analyser);
    analyser.connect(audioCtx.destination);
    analyser.fftSize = 2048;

    bufferLength = analyser.fftSize;
    dataArray = new Uint8Array(bufferLength);

    drawVisualizer();
  }
}

// Función de visualizador
function drawVisualizer() {
  animationId = requestAnimationFrame(drawVisualizer);

  analyser.getByteTimeDomainData(dataArray);

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.lineWidth = 2;
  ctx.strokeStyle = '#FF6600';
  ctx.beginPath();

  const sliceWidth = canvas.width / bufferLength;
  let x = 0;

  for (let i = 0; i < bufferLength; i++) {
    const v = dataArray[i] / 128.0;
    const y = (v * canvas.height) / 2;

    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);

    x += sliceWidth;
  }

  ctx.lineTo(canvas.width, canvas.height / 2);
  ctx.stroke();
}

// Ajusta canvas al tamaño de la ventana
function resizeCanvas() {
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// --- EVENTOS DE BOTONES ---

playBtn.addEventListener('click', () => {
  initAudio(); // Inicializa visualizador y audio context
  if (audioCtx.state === 'suspended') audioCtx.resume(); // Resume si estaba suspendido
  audio.play().catch(e => console.error('Error al reproducir:', e));
});

pauseBtn.addEventListener('click', () => {
  audio.pause();
});

muteBtn.addEventListener('click', () => {
  audio.muted = !audio.muted;
  muteBtn.style.color = audio.muted ? '#FF6600' : '#ffffff';
});
