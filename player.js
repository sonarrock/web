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

const canvas = document.getElementById("matrixCanvas");
const ctx = canvas.getContext("2d");
let columns, drops, fontSize = 16;
let animationRunning = false;
let animationFrame;

// Overlay para oscurecer ligeramente al play
const overlay = document.querySelector(".overlay");

// --------------------
// REPRODUCTOR PLAY/PAUSE/STOP
// --------------------
playPauseBtn.addEventListener("click", () => {
    if(audio.paused){
        audio.play().then(() => {
            playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
            startMatrix();
            overlay.style.background = "rgba(0,0,0,0.1)"; // solo 10% al reproducir
        }).catch(err => console.warn("Autoplay bloqueado:", err));
    } else {
        audio.pause();
        playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
        stopMatrix();
        overlay.style.background = "rgba(0,0,0,0)"; // volver transparente
    }
});

stopBtn.addEventListener("click", () => {
    audio.pause();
    audio.currentTime = 0;
    playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
    stopMatrix();
    overlay.style.background = "rgba(0,0,0,0)";
});

muteBtn.addEventListener("click", () => {
    audio.muted = !audio.muted;
    muteBtn.innerHTML = audio.muted ? '<i class="fas fa-volume-mute"></i>' : '<i class="fas fa-volume-up"></i>';
    muteBtn.style.color = audio.muted ? '#ff0000' : '#ff6600';
});

// --------------------
// PROGRESO
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
// MATRIX DENTRO DE PLAYER
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
    // Fondo semitransparente según overlay
    ctx.clearRect(0,0,canvas.width,canvas.height);

    ctx.font = fontSize + "px monospace";
    for(let i=0;i<drops.length;i++){
        const text = chars[Math.floor(Math.random()*chars.length)];
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        // Azul-plata
        ctx.fillStyle = "rgba(150,220,255,1)";
        ctx.fillText(text,x,y);

        ctx.fillStyle = "rgba(150,220,255,0.5)";
        ctx.fillText(text,x,y-fontSize);

        if(y > canvas.height && Math.random() > 0.975) drops[i] = 0;
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
