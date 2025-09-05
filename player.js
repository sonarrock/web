// ================== PLAYER ==================
const audio = document.getElementById("audio");
const playBtn = document.getElementById("play-btn");
const stopBtn = document.getElementById("stop-btn");
const muteBtn = document.getElementById("mute-btn");
const progress = document.getElementById("progress");
const timeDisplay = document.getElementById("time-display");
const progressContainer = document.querySelector(".progress-container");

let isPlaying = false;
let matrixInterval;
let liveStartTime = 0;
const isLive = audio.src.includes("zeno.fm");

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

// ================== BUTTONS ==================
playBtn.addEventListener("click", () => {
    if (!isPlaying) {
        audio.play();
        isPlaying = true;
        playBtn.innerHTML = '<i class="fas fa-pause"></i>';
        matrixInterval = setInterval(drawMatrix, 50);
        if (isLive) liveStartTime = Date.now();
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
    clearInterval(matrixInterval);
});

muteBtn.addEventListener("click", () => {
    audio.muted = !audio.muted;
    muteBtn.classList.toggle("muted", audio.muted);
});

// ================== PROGRESS ==================
audio.addEventListener("timeupdate", () => {
    if (!isLive && audio.duration) {
        let percent = (audio.currentTime / audio.duration) * 100;
        progress.style.width = percent + "%";
        let remaining = audio.duration - audio.currentTime;
        timeDisplay.textContent = formatTime(remaining);
    } else if (isLive && isPlaying) {
        let elapsed = Math.floor((Date.now() - liveStartTime) / 1000);
        timeDisplay.textContent = formatTime(elapsed);
        progress.style.width = "100%";
    }
});

// ================== INTERACTIVIDAD ==================
progressContainer.addEventListener("click", (e) => {
    if (!isLive && audio.duration) {
        const rect = progressContainer.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const percent = clickX / rect.width;
        audio.currentTime = percent * audio.duration;
    }
});

let isDragging = false;

progressContainer.addEventListener("mousedown", (e) => {
    if (!isLive && audio.duration) {
        isDragging = true;
        updateProgressByDrag(e);
    }
});

window.addEventListener("mousemove", (e) => {
    if (isDragging) updateProgressByDrag(e);
});

window.addEventListener("mouseup", () => {
    isDragging = false;
});

function updateProgressByDrag(e) {
    const rect = progressContainer.getBoundingClientRect();
    let offsetX = e.clientX - rect.left;
    offsetX = Math.max(0, Math.min(offsetX, rect.width));
    const percent = offsetX / rect.width;
    progress.style.width = (percent * 100) + "%";
    audio.currentTime = percent * audio.duration;
}

// ================== HELPER ==================
function formatTime(seconds) {
    let m = Math.floor(seconds / 60).toString().padStart(2, "0");
    let s = Math.floor(seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
}
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
let isLive = false; // si es streaming en vivo
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

// ================== BUTTONS ==================
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

// ================== PROGRESS BAR ==================
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
    let seconds = Math.floor(sec % 60);
    return `${minutes < 10 ? "0" + minutes : minutes}:${seconds < 10 ? "0" + seconds : seconds}`;
}

// Update cada 500ms
audio.addEventListener("timeupdate", updateProgress);

// ================== CLICK/DRAG EN BARRA ==================
progressContainer.addEventListener("click", (e) => {
    const rect = progressContainer.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    if (!isLive && audio.duration) {
        audio.currentTime = (clickX / width) * audio.duration;
    }
});

progressContainer.addEventListener("mousedown", () => {
    function move(e) {
        const rect = progressContainer.getBoundingClientRect();
        const moveX = e.clientX - rect.left;
        const width = rect.width;
        if (!isLive && audio.duration) {
            audio.currentTime = Math.max(0, Math.min((moveX / width) * audio.duration, audio.duration));
        }
    }
    function up() {
        document.removeEventListener("mousemove", move);
        document.removeEventListener("mouseup", up);
    }
    document.addEventListener("mousemove", move);
    document.addEventListener("mouseup", up);
});
