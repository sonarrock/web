// ===============================
// DESBLOQUEO iOS AUDIO (OBLIGATORIO)
// ===============================
let audioUnlocked = false;

function unlockIOSAudio() {
  if (audioUnlocked) return;

  audio.muted = true;
  audio.play().then(() => {
    audio.pause();
    audio.muted = false;
    audioUnlocked = true;
    console.log("🔓 Audio desbloqueado iOS");
  }).catch(() => {});
}

document.addEventListener("touchstart", unlockIOSAudio, { once: true });
document.addEventListener("click", unlockIOSAudio, { once: true });


// ===============================
// SONAR ROCK PLAYER + MATRIX PRO
// ===============================

const audio = document.getElementById("radio-audio");
const playPauseBtn = document.getElementById("playPauseBtn");
const stopBtn = document.getElementById("stop-btn");
const muteBtn = document.getElementById("mute-btn");
const progress = document.getElementById("radio-progress");
const progressContainer = document.getElementById("radio-progress-container");
const timeDisplay = document.getElementById("time-display");

// ===============================
// VOLUMEN PERSISTENTE
// ===============================
const savedVolume = localStorage.getItem("sr-volume");
audio.volume = savedVolume !== null ? parseFloat(savedVolume) : 1;

audio.addEventListener("volumechange", () => {
  localStorage.setItem("sr-volume", audio.volume);
});

// ===============================
// CANVAS MATRIX
// ===============================
const canvas = document.getElementById("matrixCanvas");
const ctx = canvas.getContext("2d");
const fontSize = 16;

let columns = 0;
let drops = [];
let animationRunning = false;
let animationFrameId = null;
let matrixSpeed = 1;

// --------------------
// VU METER FAKE
// --------------------
const vuBars = document.querySelectorAll(".vu-meter span");
let vuActive = false;

function animateVU() {
  if (!vuActive) return;

  vuBars.forEach((bar, i) => {
    // sincronía visual con matrix
    const intensity = Math.random() * 0.8 + 0.2;
    bar.style.height = `${intensity * 100}%`;
  });

  requestAnimationFrame(animateVU);
}


// --------------------
// RESIZE
// --------------------
function resizeCanvas() {
  const container = document.querySelector(".player-container");
  if (!container) return;

  canvas.width = container.clientWidth;
  canvas.height = container.clientHeight;

  columns = Math.floor(canvas.width / fontSize);
  drops = Array(columns).fill(1);
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// ===============================
// MATRIX AZUL ELÉCTRICO
// ===============================
const chars =
  "アァイィウヴエェオカガキギクグabcdefghijklmnopqrstuvwxyz0123456789".split(
    ""
  );

function drawMatrix() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = `${fontSize}px monospace`;

  for (let i = 0; i < drops.length; i++) {
    const text = chars[Math.floor(Math.random() * chars.length)];
    const x = i * fontSize;
    const y = drops[i] * fontSize;

    ctx.shadowColor = "rgba(120,220,255,1)";
    ctx.shadowBlur = 18;
    ctx.fillStyle = "rgba(200,245,255,1)";
    ctx.fillText(text, x, y);

    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(120,200,255,0.35)";
    ctx.fillText(text, x, y - fontSize);

    if (y > canvas.height && Math.random() > 0.975) drops[i] = 0;
    drops[i] += matrixSpeed;
  }

  animationFrameId = requestAnimationFrame(drawMatrix);
}

function startMatrix() {
  if (!animationRunning) {
    animationRunning = true;
    drawMatrix();
  }
}

function stopMatrix() {
  animationRunning = false;
  cancelAnimationFrame(animationFrameId);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// ===============================
// STREAM CONTROLS
// ===============================
async function playStream() {
  try {
    audio.muted = false;
    audio.volume = audio.volume || 1;

    await audio.play(); // 👈 ACTIVACIÓN CLAVE

    playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
    document.body.classList.add("playing");
    startMatrix();
  } catch (err) {
    console.warn("Bloqueo de audio, reintentando...");
  }
}


    // 🔥 MATRIX + VU
    startMatrix();
    vuActive = true;
    animateVU();

  } catch (err) {
    console.warn("Bloqueo de audio, reintentando...");
  }
}

playPauseBtn.addEventListener("click", () => {
  if (audio.paused) {
    playStream();
  } else {
    audio.pause();
  }
});

stopBtn.addEventListener("click", () => {
  audio.pause();
  audio.currentTime = 0;

  // ⛔ MATRIX + VU
  stopMatrix();
  vuActive = false;

  vuBars.forEach(bar => {
    bar.style.height = "20%";
  });

  document.body.classList.remove("playing");
  playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
});

muteBtn.addEventListener("click", () => {
  audio.muted = !audio.muted;
  muteBtn.innerHTML = audio.muted
    ? '<i class="fas fa-volume-mute"></i>'
    : '<i class="fas fa-volume-up"></i>';
});


// ===============================
// TIEMPO (STREAM)
// ===============================
audio.addEventListener("timeupdate", () => {
  if (isFinite(audio.currentTime)) {
    const mins = Math.floor(audio.currentTime / 60);
    const secs = Math.floor(audio.currentTime % 60);
    timeDisplay.textContent = `${mins
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
});

// ===============================
// MATRIX INTELIGENTE
// ===============================
audio.addEventListener("playing", () => {
  matrixSpeed = 1.5;
});

audio.addEventListener("waiting", () => {
  matrixSpeed = 0.4;
});

audio.addEventListener("pause", () => {
  document.body.classList.remove("playing");
  stopMatrix();
  playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
});

// ===============================
// AUTO-RECONEXIÓN STREAM
// ===============================
audio.addEventListener("stalled", reconnect);
audio.addEventListener("error", reconnect);

function reconnect() {
  console.warn("Stream inestable, reconectando...");
  stopMatrix();
  setTimeout(() => {
    audio.load();
    playStream();
  }, 2000);
}

// ===============================
// LIVE STATUS DESDE ZENO
// ===============================
const liveIndicator = document.getElementById("live-indicator");
const liveText = liveIndicator.querySelector(".text");

async function checkLiveStatus() {
  try {
    const response = await fetch(
      "https://corsproxy.io/?https://api.zeno.fm/mounts/metadata/ezq3fcuf5ehvv"
    );
    const data = await response.json();
    const title = (data.streamTitle || "").toUpperCase();

    const isLive =
      title.includes("LIVE") ||
      title.includes("EN VIVO") ||
      title.includes("🔴");

    if (isLive) {
      liveIndicator.classList.add("live");
      liveIndicator.classList.remove("auto");
      liveText.textContent = "EN VIVO";
    } else {
      liveIndicator.classList.add("auto");
      liveIndicator.classList.remove("live");
      liveText.textContent = "PROGRAMACIÓN";
    }
  } catch (e) {
    console.warn("Metadata no disponible");
  }
}

checkLiveStatus();
setInterval(checkLiveStatus, 20000);


// ===============================
// VOLUMEN UNIVERSAL (MOUSE + TOUCH)
// ===============================
const volumeBar = document.getElementById("volume-bar");
const volumeLevel = document.getElementById("volume-level");

let isDraggingVolume = false;

// volumen inicial
audio.volume = 1;
volumeLevel.style.width = "100%";

function updateVolume(clientX) {
  const rect = volumeBar.getBoundingClientRect();
  let percent = (clientX - rect.left) / rect.width;

  percent = Math.max(0, Math.min(1, percent));

  audio.volume = percent;
  volumeLevel.style.width = `${percent * 100}%`;
}

// pointer down
volumeBar.addEventListener("pointerdown", (e) => {
  isDraggingVolume = true;
  volumeBar.setPointerCapture(e.pointerId);

  updateVolume(e.clientX);
});

// pointer move
volumeBar.addEventListener("pointermove", (e) => {
  if (!isDraggingVolume) return;
  updateVolume(e.clientX);
});

// pointer up / cancel
volumeBar.addEventListener("pointerup", () => {
  isDraggingVolume = false;
});

volumeBar.addEventListener("pointercancel", () => {
  isDraggingVolume = false;
});
