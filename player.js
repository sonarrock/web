// ================== PLAYER ==================
const audio = document.getElementById("audio");
const playBtn = document.getElementById("play-btn");
const stopBtn = document.getElementById("stop-btn");
const muteBtn = document.getElementById("mute-btn");

let isPlaying = false;

// ================== MATRIX ==================
const canvas = document.getElementById("matrix");
const ctx = canvas.getContext("2d");

function resizeCanvas() {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

// Caracteres para Matrix
const characters = "アカサタナハマヤラワABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
let fontSize = 14;
let columns = canvas.width / fontSize;
let drops = [];
for (let x = 0; x < columns; x++) drops[x] = Math.floor(Math.random() * canvas.height / fontSize);

let matrixInterval;

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

// ================== BUTTONS ==================
playBtn.addEventListener("click", () => {
    if (!isPlaying) {
        audio.play();
        isPlaying = true;
        matrixInterval = setInterval(drawMatrix, 50);
    } else {
        audio.pause();
        isPlaying = false;
        clearInterval(matrixInterval);
    }
});

stopBtn.addEventListener("click", () => {
    audio.pause();
    audio.currentTime = 0;
    isPlaying = false;
    clearInterval(matrixInterval);
});

muteBtn.addEventListener("click", () => {
    audio.muted = !audio.muted;
    muteBtn.classList.toggle("muted", audio.muted);
});
