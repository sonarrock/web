// ===============================
// SONAR ROCK PLAYER + MATRIX
// ===============================

const audio = document.getElementById("radio-audio");
const playPauseBtn = document.getElementById("playPauseBtn");
const stopBtn = document.getElementById("stop-btn");
const muteBtn = document.getElementById("mute-btn");
const progress = document.getElementById("radio-progress");
const progressContainer = document.getElementById("radio-progress-container");
const timeDisplay = document.getElementById("time-display");

// Canvas Matrix dentro de la imagen
const canvas = document.getElementById("matrixCanvas");
const ctx = canvas.getContext("2d");
let columns, drops, fontSize = 16;
let animationRunning = false;
let animationFrame;

// --------------------
// RESIZE CANVAS AL CONTENEDOR
// --------------------
function resizeCanvas(){
    const container = document.querySelector(".player-container");
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    columns = Math.floor(canvas.width / fontSize);
    drops = Array(columns).fill(1);
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// --------------------
// MATRIX AZUL-PLATEADO
// --------------------
const chars = "アァイィウヴエェオカガキギクグケゲコゴabcdefghijklmnopqrstuvwxyz0123456789".split("");

function drawMatrix(){
    // Fondo semitransparente ligero
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = "rgba(0,0,0,0.1)"; // overlay muy ligero
    ctx.fillRect(0,0,canvas.width,canvas.height);

    ctx.font = fontSize + "px monospace";
    for(let i=0;i<drops.length;i++){
        const text = chars[Math.floor(Math.random()*chars.length)];
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        ctx.fillStyle = "rgba(150,220,255,1)";
        ctx.fillText(text,x,y);
        ctx.fillStyle = "rgba(150,220,255,0.5)";
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
// CONTROLES REPRODUCTOR
// --------------------
playPauseBtn.addEventListener("click", () => {
    if(audio.paused){
        audio.play().then(() => {
            playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
            startMatrix();
            // Overlay ligero al play
            document.querySelector(".overlay").style.background = "rgba(0,0,0,0.1)";
        }).catch(err => console.warn("Autoplay bloqueado:", err));
    } else {
        audio.pause();
        playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
        stopMatrix();
        document.querySelector(".overlay").style.background = "transparent";
    }
});

stopBtn.addEventListener("click", () => {
    audio.pause();
    audio.currentTime = 0;
    playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
    stopMatrix();
    document.querySelector(".overlay").style.background = "transparent";
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
