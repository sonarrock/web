// ================== PLAYER ==================
const audio = document.getElementById("audio");
const playBtn = document.getElementById("play-btn");
const stopBtn = document.getElementById("stop-btn");
const muteBtn = document.getElementById("mute-btn");

// Play / Pause
playBtn.addEventListener("click", () => {
    if (audio.paused) {
        audio.play();
        matrixRunning = true;
        playBtn.innerHTML = '<i class="fas fa-pause"></i>';
    } else {
        audio.pause();
        matrixRunning = false;
        playBtn.innerHTML = '<i class="fas fa-play"></i>';
    }
});

// Stop
stopBtn.addEventListener("click", () => {
    audio.pause();
    audio.currentTime = 0;
    matrixRunning = false;
    playBtn.innerHTML = '<i class="fas fa-play"></i>';
});

// Mute / Unmute
muteBtn.addEventListener("click", () => {
    audio.muted = !audio.muted;
    muteBtn.innerHTML = audio.muted
        ? '<i class="fas fa-volume-mute"></i>'
        : '<i class="fas fa-volume-up"></i>';
});

// ================== MATRIX ANIMATION ==================
const canvas = document.getElementById("matrix");
const ctx = canvas.getContext("2d");

// Ajusta el tamaño del canvas
canvas.width = canvas.offsetWidth;
canvas.height = canvas.offsetHeight;

// Caracteres y columnas
const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*()*&^%";
const fontSize = 12; // más pequeño = más columnas
const columns = Math.floor(canvas.width / fontSize);

// Arreglo de posiciones Y de cada columna
const drops = Array(columns).fill(0);

// Control de animación
let matrixRunning = false;

// Animación
function draw() {
    if (!matrixRunning) return;

    // Fondo semitransparente para efecto "trazo"
    ctx.fillStyle = "rgba(0,0,0,0.05)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#0F0";
    ctx.font = fontSize + "px monospace";

    for (let i = 0; i < drops.length; i++) {
        const text = chars.charAt(Math.floor(Math.random() * chars.length));
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

        // Reinicia la columna aleatoriamente para efecto infinito
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
            drops[i] = 0;
        }

        drops[i]++;
    }

    requestAnimationFrame(draw);
}

// Inicializa matrix solo al dar play
audio.addEventListener("play", () => {
    if (!matrixRunning) {
        matrixRunning = true;
        draw();
    }
});

audio.addEventListener("pause", () => {
    matrixRunning = false;
});

audio.addEventListener("ended", () => {
    matrixRunning = false;
    playBtn.innerHTML = '<i class="fas fa-play"></i>';
});
