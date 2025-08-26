document.addEventListener('DOMContentLoaded', function() {
  const playBtn = document.getElementById('play-btn');
  const stopBtn = document.getElementById('stop-btn');
  const muteBtn = document.getElementById('mute-btn');
  const audio = document.getElementById('audio');
  const nowPlaying = document.getElementById('now-playing');

  let isPlaying = false;
  let isMuted = false;

  // ===== CONTROLES DE AUDIO =====
  playBtn.addEventListener('click', function() {
    if (!isPlaying) {
      audio.play().catch(e => console.error('Error al reproducir:', e));
      playBtn.innerHTML = '<i class="fas fa-pause"></i>';
      stopBtn.innerHTML = '<i class="fas fa-stop"></i>';
    } else {
      audio.pause();
      playBtn.innerHTML = '<i class="fas fa-play"></i>';
    }
    isPlaying = !isPlaying;
  });

  stopBtn.addEventListener('click', function() {
    audio.pause();
    audio.currentTime = 0;
    playBtn.innerHTML = '<i class="fas fa-play"></i>';
    stopBtn.innerHTML = '<i class="fas fa-stop"></i>';
    isPlaying = false;
  });

  muteBtn.addEventListener('click', function() {
    isMuted = !isMuted;
    audio.muted = isMuted;
    muteBtn.innerHTML = isMuted ? '<i class="fas fa-volume-mute"></i>' : '<i class="fas fa-volume-up"></i>';
  });

  // ===== METADATOS =====
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

  // ===== VISUALIZADOR MATRIX =====
  const canvas = document.getElementById("matrix");
  const ctx = canvas.getContext("2d");

  function ajustarCanvas() {
    canvas.width = canvas.parentElement.offsetWidth;
    canvas.height = canvas.parentElement.offsetHeight;
  }
  ajustarCanvas();
  window.addEventListener('resize', ajustarCanvas);

  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ123456789@#$%^&*()*&^%";
  const fontSize = 16;
  const columns = Math.floor(canvas.width / fontSize);
  const drops = Array(columns).fill(1);

  function drawMatrix() {
    ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "rgba(0, 255, 70, 0.75)";
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

  let matrixInterval = null;

  function startMatrix() {
    if (!matrixInterval) matrixInterval = setInterval(drawMatrix, 50);
  }

  function stopMatrix() {
    if (matrixInterval) clearInterval(matrixInterval);
    matrixInterval = null;
  }

  audio.addEventListener('play', startMatrix);
  audio.addEventListener('pause', stopMatrix);
  audio.addEventListener('ended', stopMatrix);

  drawMatrix();

  // ===== INSERTAR REPRODUCTOR IVOOX SOLO EN SU CONTENEDOR =====
  const podcastPlayer = document.getElementById("podcast-player");
  if (podcastPlayer) {
    podcastPlayer.innerHTML = `
      <iframe 
        src="https://www.ivoox.com/player_ejemplo" 
        width="100%" 
        height="170" 
        frameborder="0" 
        allow="autoplay; encrypted-media" 
        style="border-radius:12px; box-shadow:0 8px 24px rgba(0,0,0,0.6);">
      </iframe>
    `;
  }
});
