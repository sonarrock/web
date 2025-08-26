// ================== PLAYER ZENO ==================
const audio = document.getElementById("audio");
const playBtn = document.getElementById("play-btn");
const stopBtn = document.getElementById("stop-btn");
const muteBtn = document.getElementById("mute-btn");
const canvas = document.getElementById("matrix");
const ctx = canvas.getContext("2d");

// ================== MATRIX ANIMATION ==================
let animationId;
const fontSize = 14; // tamaño de fuente
let columns;

function setupCanvas() {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    columns = Math.floor(canvas.width / fontSize);
    // Array con posiciones Y de cada columna
    matrixDrops = Array(columns).fill(0);
}
setupCanvas();
window.addEventListener('resize', setupCanvas);

let matrixDrops = [];

// Dibujo de Matrix
function drawMatrix() {
    ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#0F0";
    ctx.font = fontSize + "px monospace";

    for (let i = 0; i < matrixDrops.length; i++) {
        const text = String.fromCharCode(33 + Math.random() * 94);
        ctx.fillText(text, i * fontSize, matrixDrops[i] * fontSize);

        if (matrixDrops[i] * fontSize > canvas.height && Math.random() > 0.975) {
            matrixDrops[i] = 0;
        }
        matrixDrops[i]++;
    }
    animationId = requestAnimationFrame(drawMatrix);
}

// ================== BOTONES ==================
// PLAY
playBtn.addEventListener("click", () => {
    audio.play();
    drawMatrix();
});

// STOP
stopBtn.addEventListener("click", () => {
    audio.pause();
    audio.currentTime = 0;
    cancelAnimationFrame(animationId);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
});

// MUTE
muteBtn.addEventListener("click", () => {
    audio.muted = !audio.muted;
    if(audio.muted){
        muteBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
    } else {
        muteBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
    }
});

