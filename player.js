document.addEventListener("DOMContentLoaded", () => {

  // ===============================
  // ELEMENTOS
  // ===============================
  const audio = document.getElementById("radio-audio");
  const playPauseBtn = document.getElementById("playPauseBtn");
  const stopBtn = document.getElementById("stop-btn");
  const muteBtn = document.getElementById("mute-btn");
  const timeDisplay = document.getElementById("time-display");
  const canvas = document.getElementById("matrixCanvas");
  const liveIndicator = document.getElementById("live-indicator");

  if (!audio || !playPauseBtn || !canvas || !liveIndicator) {
    console.error("❌ Elementos críticos no encontrados");
    return;
  }

  const liveText = liveIndicator.querySelector(".text");

  audio.playsInline = true;
  audio.preload = "auto";

  // ===============================
  // TIMER FAKE
  // ===============================
  let timer = null;
  let startTime = 0;

  function startTimer() {
    stopTimer();
    startTime = Date.now();
    timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const m = String(Math.floor(elapsed / 60)).padStart(2, "0");
      const s = String(elapsed % 60).padStart(2, "0");
      timeDisplay.textContent = `${m}:${s}`;
    }, 1000);
  }

  function stopTimer() {
    clearInterval(timer);
    timer = null;
    timeDisplay.textContent = "00:00";
  }

  // ===============================
  // MATRIX
  // ===============================
  const ctx = canvas.getContext("2d");
  const fontSize = 16;
  let drops = [];
  let matrixRunning = false;

  function resizeCanvas() {
    const container = document.querySelector(".player-container");
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    drops = Array(Math.floor(canvas.width / fontSize)).fill(1);
  }

  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);

  const chars = "01ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  function drawMatrix() {
    if (!matrixRunning) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = `${fontSize}px monospace`;
    ctx.fillStyle = "rgba(0,255,180,0.8)";

    drops.forEach((y, i) => {
      const char = chars[Math.floor(Math.random() * chars.length)];
      ctx.fillText(char, i * fontSize, y * fontSize);
      drops[i] = y * fontSize > canvas.height && Math.random() > 0.97 ? 0 : y + 1;
    });

    requestAnimationFrame(drawMatrix);
  }

  function startMatrix() {
    if (matrixRunning) return;
    matrixRunning = true;
    drawMatrix();
  }

  function stopMatrix() {
    matrixRunning = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  // ===============================
  // LIVE STATUS
  // ===============================
  let liveActive = false;

  function setLive(on) {
    if (!liveText) return;

    if (on && !liveActive) {
      liveActive = true;
      liveIndicator.classList.remove("auto");
      liveIndicator.classList.add("live");
      liveText.textContent = "EN VIVO";
    }

    if (!on && liveActive) {
      liveActive = false;
      liveIndicator.classList.remove("live");
      liveIndicator.classList.add("auto");
      liveText.textContent = "PROGRAMACIÓN";
    }
  }

  // ===============================
  // CONTROLES (ÚNICO PLAY)
  // ===============================
  playPauseBtn.addEventListener("click", async () => {
    if (!audio.paused) {
      audio.pause();
      return;
    }

    try {
      await audio.play();
    } catch (err) {
      console.warn("⚠️ Play bloqueado", err);
    }
  });

  stopBtn.addEventListener("click", () => {
    audio.pause();
    audio.currentTime = 0;
  });

  muteBtn.addEventListener("click", () => {
    audio.muted = !audio.muted;
    muteBtn.innerHTML = audio.muted
      ? '<i class="fas fa-volume-mute"></i>'
      : '<i class="fas fa-volume-up"></i>';
  });

  // ===============================
  // EVENTOS AUDIO
  // ===============================
  audio.addEventListener("playing", () => {
    playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
    startTimer();
    startMatrix();
  });

  audio.addEventListener("pause", () => {
    playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
    stopTimer();
    stopMatrix();
    setLive(false);
  });

  audio.addEventListener("error", () => {
    setLive(false);
  });


// ===============================
// LIVE STATUS DESDE ZENO (REAL)
// ===============================
const ZENO_META =
  "https://corsproxy.io/?https://api.zeno.fm/mounts/metadata/ezq3fcuf5ehvv";

let lastLiveState = null;

async function checkLiveFromZeno() {
  try {
    const res = await fetch(ZENO_META, { cache: "no-store" });
    const data = await res.json();

    const listeners = Number(data.listeners || 0);
    const title = (data.streamTitle || "").toUpperCase();

    // 🔴 Zeno REAL logic
    const isLive =
      listeners > 0 ||
      title.includes("LIVE") ||
      title.includes("DJ") ||
      title.includes("EN VIVO");

    if (isLive !== lastLiveState) {
      lastLiveState = isLive;
      setLive(isLive);
      console.log(
        "🎙️ Estado Zeno:",
        isLive ? "EN VIVO" : "PROGRAMACIÓN",
        "| listeners:", listeners
      );
    }
  } catch (err) {
    console.warn("⚠️ No se pudo consultar Zeno");
    setLive(false);
  }
}

// revisar cada 20 segundos
setInterval(checkLiveFromZeno, 20000);

// primer check al cargar
checkLiveFromZeno();

/* ===============================
   LIVE BADGE
================================ */
.live-badge {
  position: absolute;
  top: 18px;
  right: 18px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  font-size: 12px;
  letter-spacing: 1px;
  font-weight: 700;
  border-radius: 20px;
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(6px);
  color: #aaa;
  text-transform: uppercase;
  z-index: 20;
}

.live-badge .dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #666;
}

/* 🔴 EN VIVO */
.live-badge.live {
  color: #ff2b2b;
  box-shadow: 0 0 15px rgba(255, 50, 50, 0.6);
}

.live-badge.live .dot {
  background: #ff2b2b;
  animation: livePulse 1.2s infinite;
}

/* ⚪ PROGRAMACIÓN */
.live-badge.auto {
  color: #aaa;
}

@keyframes livePulse {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.6); opacity: 0.4; }
  100% { transform: scale(1); opacity: 1; }
}

});
                          
