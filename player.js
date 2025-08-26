document.addEventListener('DOMContentLoaded', function() {
  // ======== ELEMENTOS ========
  const playBtn = document.getElementById('play-btn');
  const stopBtn = document.getElementById('stop-btn');
  const muteBtn = document.getElementById('mute-btn');
  const audio = document.getElementById('audio');
  const nowPlaying = document.getElementById('now-playing');
  const canvas = document.getElementById('matrix');
  const ctx = canvas.getContext('2d');

  let isPlaying = false;
  let isMuted = false;
  let matrixInterval = null;

  // ======== METADATOS ========
  async function cargarMetadata() {
    try {
      const response = await fetch("https://stream.zeno.fm/ezq3fcuf5ehvv?json=1");
      const data = await response.json();

      if (data.artist && data.title) {
        nowPlaying.textContent = `${data.artist} - ${data.title}`;
      } else {
        nowPlaying.textContent = "Escuchando Sonar Rock";
      }
    } catch (error) {
      nowPlaying.textContent = "Cargando canción...";
      console.error("Error cargando metadata:", error);
    }
  }
  cargarMetadata();
  setInterval(cargarMetadata, 15000);

  // ======== CONTROLES ========
  playBtn.addEventListener('click', function() {
    if (!isPlaying) {
      audio.play().catch(e => console.error('Error al reproducir:', e));
      playBtn.innerHTML = '<i class="fas fa-pause"></i>';
      startMatrix();
    } else {
      audio.pause();
      playBtn.innerHTML = '<i class="fas fa-play"></i>';
      stopMatrix();
    }
    isPlaying = !isPlaying;
  });

  stopBtn.addEventListener('click', function() {
    audio.pause();
    audio.currentTime = 0;
    playBtn.innerHTML = '<i class="fas fa-play"></i>';
    isPlaying = false;
    stopMatrix();
  });

  muteBtn.addEventListener('click', function() {
    isMuted = !isMuted;
    audio.muted = isMuted;
    muteBtn.innerHTML = isMuted ? '<i class="fas fa-volume-mute"></i>' : '<i class="fas fa-volume-up"></i>';
  });

  // ======== ANIMACIÓN MATRIX ========
  function ajustarCanvas() {
    canvas.width = canvas.parentElement.offsetWidth;
    canvas.height = canvas.parentElement.offsetHeight;
  }
  ajustarCanvas();
  window.addEventListener('resize', ajustarCanvas);

  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ123456789@#$%^&*()*&^%";
  const fontSize = 14; // más pequeño = más caracteres
  const columns = canvas.width / fontSize;
  let drops = Array(columns).fill(1);

  function drawMatrix() {
    ctx.fillStyle = "rgba(0,0,0,0.5)"; // opacidad 50%
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "rgba(0,255,70,0.75)";
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

  function startMatrix() {
    if (!matrixInterval) matrixInterval = setInterval(drawMatrix, 50);
  }

  function stopMatrix() {
    if (matrixInterval) clearInterval(matrixInterval);
    matrixInterval = null;
    drawMatrix(); // muestra estático al pausar
  }

  drawMatrix(); // estado inicial
});
