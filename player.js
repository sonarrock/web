const audio = document.getElementById('audio');
const playBtn = document.getElementById('play-btn');
const stopBtn = document.getElementById('stop-btn');
const muteBtn = document.getElementById('mute-btn');
const nowPlaying = document.getElementById('now-playing');
const canvas = document.getElementById('matrix');
const ctx = canvas.getContext('2d');

let isPlaying = false;
let animationId;

// Ajuste del canvas
function resizeCanvas() {
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Matrix Effect
const letters = 'アカサタナハマヤラワABCDEFGHIJKLMNOPQRSTUVWXYZ123456789@#$%^&*';
const lettersArray = letters.split('');
const fontSize = 14;
let columns = canvas.width / fontSize;
let drops = Array(Math.floor(columns)).fill(1);

function drawMatrix() {
  ctx.fillStyle = 'rgba(0,0,0,0.1)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#00FF41';
  ctx.font = `${fontSize}px monospace`;

  for (let i = 0; i < drops.length; i++) {
    const text = lettersArray[Math.floor(Math.random() * lettersArray.length)];
    ctx.fillText(text, i * fontSize, drops[i] * fontSize);

    if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
      drops[i] = 0;
    }
    drops[i]++;
  }

  animationId = requestAnimationFrame(drawMatrix);
}

// Control Play/Pause
playBtn.addEventListener('click', () => {
  if (!isPlaying) {
    audio.play();
    drawMatrix();
    playBtn.innerHTML = '<i class="fas fa-pause"></i>';
  } else {
    audio.pause();
    cancelAnimationFrame(animationId);
    playBtn.innerHTML = '<i class="fas fa-play"></i>';
  }
  isPlaying = !isPlaying;
});

// Stop
stopBtn.addEventListener('click', () => {
  audio.pause();
  audio.currentTime = 0;
  cancelAnimationFrame(animationId);
  playBtn.innerHTML = '<i class="fas fa-play"></i>';
  isPlaying = false;
});

// Mute
muteBtn.addEventListener('click', () => {
  audio.muted = !audio.muted;
  muteBtn.innerHTML = audio.muted
    ? '<i class="fas fa-volume-mute"></i>'
    : '<i class="fas fa-volume-up"></i>';
});

// Mostrar metadata placeholder
audio.addEventListener('play', () => {
  nowPlaying.textContent = 'Reproduciendo...';
});

audio.addEventListener('pause', () => {
  nowPlaying.textContent = 'Pausado';
});

audio.addEventListener('ended', () => {
  nowPlaying.textContent = 'Reproducción finalizada';
  cancelAnimationFrame(animationId);
  playBtn.innerHTML = '<i class="fas fa-play"></i>';
  isPlaying = false;
});

// ================== IVOOX ==================
async function loadLatestIvooxEpisode() {
  const feedUrl = "https://corsproxy.io/?https://www.ivoox.com/feed_fg_f12661206_filtro_1.xml";
  try {
    const response = await fetch(feedUrl);
    const xmlText = await response.text();
    const parser = new DOMParser();
    const xml = parser.parseFromString(xmlText, "text/xml");
    const item = xml.querySelector("item");
    if (!item) throw new Error("No se encontró ningún episodio");
    
    const title = item.querySelector("title").textContent;
    const audioUrl = item.querySelector("enclosure").getAttribute("url");
    const pubDate = new Date(item.querySelector("pubDate").textContent).toLocaleDateString();
    const imageUrl = item.querySelector("itunes\\:image, image")?.getAttribute("href") || "https://static-1.ivoox.com/img/podcast_default.jpg";

    const playerHTML = `
      <div>
        <img src="${imageUrl}" alt="Carátula episodio">
        <div style="flex:1;">
          <h3>${title}</h3>
          <p>Publicado el ${pubDate}</p>
          <audio controls preload="none">
            <source src="${audioUrl}" type="audio/mpeg" />
            Tu navegador no soporta audio HTML5.
          </audio>
        </div>
      </div>
    `;
    document.getElementById("podcast-player").innerHTML = playerHTML;
  } catch (error) {
    document.getElementById("podcast-player").innerHTML = `<p style="color:#f00;">No se pudo cargar el reproductor. Intenta más tarde.</p>`;
    console.error("Error cargando el feed:", error);
  }
}

