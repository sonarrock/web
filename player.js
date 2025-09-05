// ================== PLAYER ==================
const audio = document.getElementById("audio");
const playBtn = document.getElementById("play-btn");
const stopBtn = document.getElementById("stop-btn");
const muteBtn = document.getElementById("mute-btn");
const progressContainer = document.querySelector(".progress-container");
const progressBar = document.getElementById("progress");
const timeDisplay = document.getElementById("time-display");
const nowPlaying = document.getElementById("now-playing");

let isPlaying = false;
let isLive = false; // true si es streaming en vivo
let matrixInterval;

// ================== MATRIX ==================
const canvas = document.getElementById("matrix");
const ctx = canvas.getContext("2d");

function resizeCanvas() {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

const characters = "アカサタナハマヤラワABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
let fontSize = 14;
let columns = canvas.width / fontSize;
let drops = [];
for (let x = 0; x < columns; x++) drops[x] = Math.floor(Math.random() * canvas.height / fontSize);

function drawMatrix() {
    ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#0F0";
    ctx.font = fontSize + "px monospace";
    for (let i = 0; i < drops.length; i++) {
        const text = characters.charAt(Math.floor(Math.random() * characters.length));
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);
        drops[i]++;
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) drops[i] = 0;
    }
}

// ================== BOTONES ==================
playBtn.addEventListener("click", () => {
    if (!isPlaying) {
        audio.play();
        isPlaying = true;
        playBtn.innerHTML = '<i class="fas fa-pause"></i>';
        matrixInterval = setInterval(drawMatrix, 50);
    } else {
        audio.pause();
        isPlaying = false;
        playBtn.innerHTML = '<i class="fas fa-play"></i>';
        clearInterval(matrixInterval);
    }
});

stopBtn.addEventListener("click", () => {
    audio.pause();
    audio.currentTime = 0;
    isPlaying = false;
    playBtn.innerHTML = '<i class="fas fa-play"></i>';
    updateProgress();
    clearInterval(matrixInterval);
});

muteBtn.addEventListener("click", () => {
    audio.muted = !audio.muted;
    muteBtn.classList.toggle("muted", audio.muted);
});

// ================== BARRA DE PROGRESO ==================
function updateProgress() {
    let percent;
    let currentTime = audio.currentTime;
    let duration = audio.duration;
    if (!isLive && !isNaN(duration)) {
        percent = (currentTime / duration) * 100;
        timeDisplay.textContent = formatTime(currentTime) + " / " + formatTime(duration);
    } else {
        percent = (currentTime / 60) * 100; // aproximación live
        timeDisplay.textContent = formatTime(currentTime);
    }
    progressBar.style.width = percent + "%";
}

function formatTime(sec) {
    let minutes = Math.floor(sec / 60);
    let seconds = Math.floor(sec
