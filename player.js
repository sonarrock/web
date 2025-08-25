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

playBtn.addEventListener('click', () => {
  // Inicializa AudioContext solo al primer click
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

  if (audioCtx.state === 'suspended') audioCtx.resume(); // Resume inmediato
  audio.play().catch(e => console.error('Error al reproducir:', e));
});
const botones = document.querySelectorAll('#sonar-player-container .controles button');

botones.forEach(btn => {
  btn.addEventListener('mousedown', () => {
    btn.style.background = 'rgba(255,255,255,1)';
    btn.style.color = '#ffffff';
    btn.style.transform = 'scale(1.3)';
  });

  btn.addEventListener('mouseup', () => {
    btn.style.background = 'rgba(255,255,255,0.8)';
    btn.style.color = '#FF6600';
    btn.style.transform = 'scale(1)';
  });

  btn.addEventListener('mouseleave', () => {
    btn.style.background = 'rgba(255,255,255,0.8)';
    btn.style.color = '#FF6600';
    btn.style.transform = 'scale(1)';
  });
});

#sonar-player-container .en-vivo {
  position: absolute;
  top: 28%; /* un poco más abajo */
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 1.2rem; /* base más chica */
  font-weight: bold;
  color: #ffffff;
  text-shadow: 1px 1px 3px rgba(0,0,0,0.6);
  z-index: 10;
}

@media (max-width: 480px) {
  #sonar-player-container .en-vivo {
    font-size: 1rem; /* aún más pequeña en celulares */
  }
}
