// Player.js original restaurado

const audio = document.getElementById("audio");
const playBtn = document.getElementById("play-btn");
const stopBtn = document.getElementById("stop-btn");
const muteBtn = document.getElementById("mute-btn");

let isPlaying = false;

// Play / Pause
playBtn.addEventListener("click", () => {
    if (!isPlaying) {
        audio.play();
        isPlaying = true;
        playBtn.innerHTML = '<i class="fas fa-pause"></i>';
        startMatrix();
    } else {
        audio.pause();
        isPlaying = false;
        playBtn.innerHTML = '<i class="fas fa-play"></i>';
        stopMatrix();
    }
});

// Stop
stopBtn.addEventListener("click", () => {
    audio.pause();
    audio.currentTime = 0;
    isPlaying = false;
    playBtn.innerHTML = '<i class="fas fa-play"></i>';
    stopMatrix();
});

// Mute / Unmute
muteBtn.addEventListener("click", () => {
    audio.muted = !audio.muted;
    muteBtn.innerHTML = audio.muted ? '<i class="fas fa-volume-mute"></i>' : '<i class="fas fa-volume-up"></i>';
});

// Matrix animation
let canvas, ctx;
let matrixInterval;
let columns;
let drops;
let fontSize = 14; // tamaño de letra original

function startMatrix() {
    canvas = document.getElementById("matrix");
    ctx = canvas.getContext("2d");

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    columns = Math.floor(canvas.width / fontSize);
    drops = Array(columns).fill(1);

    matrixInterval = setInterval(drawMatrix, 50);
}

function stopMatrix() {
    clearInterval(matrixInterval);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function drawMatrix() {
    ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#0F0";
    ctx.font = fontSize + "px monospace";

    for (let i = 0; i < drops.length; i++) {
        const text = String.fromCharCode(33 + Math.random() * 94);
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
            drops[i] = 0;
        }
        drops[i]++;
    }
}

// Autoajuste canvas al redimensionar
window.addEventListener("resize", () => {
    if (canvas) {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        columns = Math.floor(canvas.width / fontSize);
        drops = Array(columns).fill(1);
    }
});
