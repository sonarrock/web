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
    stopBtn.innerHTML = '<i class="fas fa-stop"></i>';
    isPlaying = false;
    stopMatrix();
  });

  muteBtn.addEventListener('click', function() {
    isMuted = !isMuted;
    audio.muted = isMuted;
    muteBtn.innerHTML = isMuted ? '<i class="fas fa-volume-mute"></i>' : '<i class="fas fa-volume-up"></i>';
  });

  // ===== METADATOS =====
  async function cargarMetadata() {
    try {
      // Traer datos de Zeno/Itunes (ejemplo hijack)
      const response = await fetch('metadatos.js'); // Asegúrate de que metadatos.js exponga un feed JSON
      const data = await response.json();

      const title = data.title || "Sonar Rock";
      const pubDate = data.pubDate || "";
      const imageUrl = data.image || "https://static-1.ivoox.com/img/podcast_default.jpg";

      nowPlaying.innerHTML = `
        <div style="display:flex; align-items:center; gap:10px;">
          <img src="${imageUrl}" alt="Carátula" style="width:50px; height:50px; object-fit:cover; border-radius:8px;">
          <div>
            <strong>${title}</strong><br>
            <small>${pubDate}</small>
          </div>
        </div>
      `;
    } catch (error) {
      console.error('Error cargando metadata:', error);
      nowPlaying.textContent = "Escuchando Sonar Rock";
    }
  }

  cargarMetadata();
  setInterval(cargarMetadata, 15000); // Actualiza cada 15s

  // ===== MATRIX =====
  const canvas = document.getElementById('matrix');
  const ctx = canvas.getContext('2d');

  function ajustarCanvas() {
    canvas.width = canvas.parentElement.offsetWidth;
    canvas.height = canvas.parentElement.offsetHeight;
  }
  ajustarCanvas();
  window.addEventListener('resize', ajustarCanvas);

  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ123456789@#$%^&*()*&^%";
  const fontSize = 16;
  let columns = Math.floor(canvas.width / fontSize);
  let drops = Array(columns).fill(1);
  let matrixInterval = null;

  function drawMatrix() {
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)"; // 50% opacidad
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

  function startMatrix() {
    columns = Math.floor(canvas.width / fontSize);
    drops = Array(columns).fill(1);
    if (!matrixInterval) matrixInterval = setInterval(drawMatrix, 50);
  }

  function stopMatrix() {
    if (matrixInterval) clearInterval(matrixInterval);
    matrixInterval = null;
    drawMatrix(); // Dibuja estático al detener
  }

  drawMatrix(); // Matrix inicial estática

  // ===== Eventos de audio =====
  audio.addEventListener('play', startMatrix);
  audio.addEventListener('pause', stopMatrix);
  audio.addEventListener('ended', stopMatrix);
});
