// ===============================
// SONAR ROCK PLAYER + MATRIX + CONTENIDO
// ===============================
const audio = document.getElementById("radio-audio");
const playPauseBtn = document.getElementById("playPauseBtn");
const stopBtn = document.getElementById("stop-btn");
const muteBtn = document.getElementById("mute-btn");
const progress = document.getElementById("radio-progress");
const progressContainer = document.getElementById("radio-progress-container");
const timeDisplay = document.getElementById("time-display");

// Matrix
const canvas = document.getElementById("matrixCanvas");
const ctx = canvas.getContext("2d");
let columns, drops, fontSize = 16;
let animationRunning = false;
let animationFrame;

// Contenido multimedia
let discoLoaded = false;
let ivooxLoaded = false;
const discoAudio = document.getElementById("disco-audio");
const cover = document.getElementById("cover");
const trackTitle = document.getElementById("track-title");
const discoProgress = document.getElementById("disco-progress");
const discoProgressContainer = document.getElementById("disco-progress-container");
const ivooxContainer = document.getElementById("podcast-player");

// --------------------
// REPRODUCTOR STREAMING
// --------------------
playPauseBtn.addEventListener("click", () => {
    if(audio.paused){
        audio.play().then(() => {
            playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
            startMatrix();
            // Cargar Disco y iVoox solo al play
            if(!discoLoaded) loadDisco();
            if(!ivooxLoaded) loadIvoox();
        }).catch(err => console.warn("Autoplay bloqueado:", err));
    } else {
        audio.pause();
        playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
        stopMatrix();
        pauseDisco();
    }
});

stopBtn.addEventListener("click", () => {
    audio.pause();
    audio.currentTime = 0;
    playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
    stopMatrix();
    pauseDisco();
});

muteBtn.addEventListener("click", () => {
    audio.muted = !audio.muted;
    muteBtn.innerHTML = audio.muted ? '<i class="fas fa-volume-mute"></i>' : '<i class="fas fa-volume-up"></i>';
    muteBtn.style.color = audio.muted ? '#ff0000' : '#ff6600';
});

// --------------------
// PROGRESO STREAMING
// --------------------
audio.addEventListener("timeupdate", () => {
    if(audio.duration){
        progress.style.width = (audio.currentTime / audio.duration * 100) + "%";
        const hrs = Math.floor(audio.currentTime / 3600);
        const mins = Math.floor((audio.currentTime % 3600)/60);
        const secs = Math.floor(audio.currentTime % 60);
        timeDisplay.textContent = `${hrs.toString().padStart(2,"0")}:${mins.toString().padStart(2,"0")}:${secs.toString().padStart(2,"0")}`;
    }
});

progressContainer.addEventListener("click", e => {
    const rect = progressContainer.getBoundingClientRect();
    audio.currentTime = ((e.clientX - rect.left) / rect.width) * audio.duration;
});

// --------------------
// MATRIX AZUL-PLATEADO
// --------------------
function resizeCanvas(){
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    columns = Math.floor(canvas.width / fontSize);
    drops = Array(columns).fill(1);
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

const chars = "アァイィウヴエェオカガキギクグケゲコゴabcdefghijklmnopqrstuvwxyz0123456789".split("");

function drawMatrix(){
    // Fondo semi-transparente solo si audio suena
    ctx.fillStyle = "rgba(0,0,0,0.15)"; // 15% opacidad
    ctx.fillRect(0,0,canvas.width,canvas.height);

    ctx.font = fontSize + "px monospace";
    for(let i=0;i<drops.length;i++){
        const text = chars[Math.floor(Math.random()*chars.length)];
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        // Azul-plata
        ctx.fillStyle = `rgba(150, 220, 255, 1)`;
        ctx.fillText(text,x,y);

        ctx.fillStyle = `rgba(150, 220, 255, 0.5)`;
        ctx.fillText(text,x,y-fontSize);

        if(y > canvas.height && Math.random()>0.975) drops[i] = 0;
        drops[i]++;
    }

    animationFrame = requestAnimationFrame(drawMatrix);
}

function startMatrix(){
    if(!animationRunning){
        animationRunning = true;
        drawMatrix();
    }
}

function stopMatrix(){
    if(animationRunning){
        cancelAnimationFrame(animationFrame);
        animationRunning = false;
        ctx.clearRect(0,0,canvas.width,canvas.height);
    }
}

// --------------------
// DISCO DE LA SEMANA
// --------------------
function loadDisco(){
    discoLoaded = true;
    const fileName = "Bob Dylan - The Times They Are A-Changin'.mp3";
    trackTitle.textContent = fileName.replace(/\.mp3$/i,'');
    discoAudio.src = `https://raw.githubusercontent.com/sonarrock/web/main/El%20Disco%20De%20La%20Semana/${encodeURIComponent(fileName)}`;

    // Animación portada
    let zoomDirection = 1;
    let zoomInterval;
    discoAudio.addEventListener('play', ()=>{
        zoomInterval = setInterval(()=>{
            let scale = parseFloat(cover.style.transform.replace(/[^\d.]/g,'')) || 1;
            scale += 0.0015 * zoomDirection;
            if(scale >= 1.03) zoomDirection = -1;
            if(scale <= 0.97) zoomDirection = 1;
            cover.style.transform = `scale(${scale})`;
            const shadowIntensity = 10 + (scale-0.97)*300;
            cover.style.boxShadow = `0 0 ${shadowIntensity}px rgba(255,102,0,0.6)`;
        }, 20);
    });

    discoAudio.addEventListener('pause', ()=>{
        clearInterval(zoomInterval);
        cover.style.transform='scale(1)';
        cover.style.boxShadow='none';
    });

    discoAudio.addEventListener('ended', ()=>{
        clearInterval(zoomInterval);
        cover.style.transform='scale(1)';
        cover.style.boxShadow='none';
    });

    // Barra progreso clickeable
    discoAudio.addEventListener('timeupdate', ()=>{
        if(discoAudio.duration){
            discoProgress.style.width = (discoAudio.currentTime/discoAudio.duration)*100 + '%';
        }
    });
    discoProgressContainer.addEventListener('click', e => {
        const rect = discoProgressContainer.getBoundingClientRect();
        discoAudio.currentTime = ((e.clientX - rect.left)/rect.width)*discoAudio.duration;
    });
}

function pauseDisco(){
    if(!discoAudio.paused){
        discoAudio.pause();
    }
}

// --------------------
// iVoox Embebido
// --------------------
async function loadIvoox(){
    ivooxLoaded = true;
    const feedUrl = "https://corsproxy.io/?https://www.ivoox.com/feed_fg_f12661206_filtro_1.xml";

    try{
        const response = await fetch(feedUrl);
        const xmlText = await response.text();
        const parser = new DOMParser();
        const xml = parser.parseFromString(xmlText,"text/xml");

        const item = xml.querySelector("item");
        if(!item) throw new Error("No se encontró ningún episodio");

        const title = item.querySelector("title").textContent;
        const audioUrl = item.querySelector("enclosure").getAttribute("url");
        const pubDate = new Date(item.querySelector("pubDate").textContent).toLocaleDateString();
        const imageUrl = item.querySelector("itunes\\:image, image")?.getAttribute("href") || "https://static-1.ivoox.com/img/podcast_default.jpg";

        const playerHTML = `
          <div class="podcast-episode" style="display:flex; gap:15px; align-items:center;">
            <img src="${imageUrl}" alt="Carátula episodio" style="width:140px;height:140px;border-radius:12px;object-fit:cover;">
            <div style="flex:1; display:flex; flex-direction:column; gap:5px;">
              <h3 style="margin:0;color:#fff;font-size:14px;">${title}</h3>
              <p style="margin:0;color:#b3b3b3;font-size:10px;">Publicado el ${pubDate}</p>
              <audio controls preload="none" style="width:100%; border-radius:8px; background:#222; filter:drop-shadow(0 1px 1px rgba(0,0,0,0.5));">
                <source src="${audioUrl}" type="audio/mpeg">
                Tu navegador no soporta audio HTML5.
              </audio>
            </div>
          </div>
        `;
        ivooxContainer.innerHTML = playerHTML;
    }catch(error){
        ivooxContainer.innerHTML = `<p style="color:#f00;">No se pudo cargar el reproductor. Intenta más tarde.</p>`;
        console.error("Error cargando feed iVoox:", error);
    }
}
