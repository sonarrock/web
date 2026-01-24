document.addEventListener("DOMContentLoaded", () => {

  // ===============================
  // ELEMENTOS
  // ===============================
  const audio = document.getElementById("radio-audio");
  const playPauseBtn = document.getElementById("playPauseBtn");
  const stopBtn = document.getElementById("stop-btn");
  const muteBtn = document.getElementById("mute-btn");
  const timeDisplay = document.getElementById("time-display");
  const matrixCanvas = document.getElementById("matrixCanvas");
  const spectrumCanvas = document.getElementById("spectrumCanvas");
  const liveIndicator = document.getElementById("live-indicator");

  if (!audio || !playPauseBtn || !matrixCanvas || !spectrumCanvas || !liveIndicator) {
    console.error("❌ Elementos críticos no encontrados");
    return;
  }

  const liveText = liveIndicator.querySelector(".text");

  audio.playsInline = true;
  audio.preload = "auto";

  // ===============================
  // TIMER
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
  const mctx = matrixCanvas.getContext("2d");
  const fontSize = 16;
  let drops = [];
  let matrixRunning = false;

  function resizeMatrix() {
    const c = document.querySelector(".player-container");
    matrixCanvas.width = c.clientWidth;
    matrixCanvas.height = c.clientHeight;
    drops = Array(Math.floor(matrixCanvas.width / fontSize)).fill(1);
  }

  resizeMatrix();
  window.addEventListener("resize", resizeMatrix);

  const chars = "01ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  function drawMatrix() {
    if (!matrixRunning) return;

    mctx.clearRect(0, 0, matrixCanvas.width, matrixCanvas.height);
    mctx.font = `${fontSize}px monospace`;
    mctx.fillStyle = "rgba(0,255,180,0.6)";

    drops.forEach((y, i) => {
      const char = chars[Math.floor(Math.random() * chars.length)];
      mctx.fillText(char, i * fontSize, y * fontSize);
      drops[i] = y * fontSize > matrixCanvas.height ? 0 : y + 1;
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
    mctx.clearRect(0, 0, matrixCanvas.width, matrixCanvas.height);
  }

  // ===============================
  // ANALIZADOR CIRCULAR REAL
  // ===============================
  let audioCtx, analyser, source, spectrumRAF;
  const sctx = spectrumCanvas.getContext("2d");

  function resizeSpectrum() {
    const c = document.querySelector(".player-container");
    spectrumCanvas.width = c.clientWidth;
    spectrumCanvas.height = c.clientHeight;
  }

  resizeSpectrum();
  window.addEventListener("resize", resizeSpectrum);

  function initSpectrum() {
    if (audioCtx) return;

    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 512;

    source = audioCtx.createMediaElementSource(audio);
    source.connect(analyser);
    analyser.connect(audioCtx.destination);
  }

  function drawSpectrum() {
    const data = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(data);

    sctx.clearRect(0, 0, spectrumCanvas.width, spectrumCanvas.height);

    const cx = spectrumCanvas.width / 2;
    const cy = spectrumCanvas.height / 2;
    const r = Math.min(cx, cy) * 0.35;

    for (let i = 0; i < 120; i++) {
      const v = data[i] / 255;
      const a = (i / 120) * Math.PI * 2;

      sctx.strokeStyle = `rgba(0,255,200,${0.3 + v})`;
      sctx.lineWidth = 2;
      sctx.beginPath();
      sctx.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
      sctx.lineTo(cx + Math.cos(a) * (r + v * r), cy + Math.sin(a) * (r + v * r));
      sctx.stroke();
    }

    spectrumRAF = requestAnimationFrame(drawSpectrum);
  }

  function startSpectrum() {
    initSpectrum();
    audioCtx.resume();
    cancelAnimationFrame(spectrumRAF);
    drawSpectrum();
  }

  function stopSpectrum() {
    cancelAnimationFrame(spectrumRAF);
    sctx.clearRect(0, 0, spectrumCanvas.width, spectrumCanvas.height);
  }

  // ===============================
  // LIVE STATUS
  // ===============================
  function setLive(on) {
    if (!liveText) return;

    liveIndicator.classList.toggle("live", on);
    liveIndicator.classList.toggle("auto", !on);
    liveText.textContent = on ? "EN VIVO" : "PROGRAMACIÓN";
  }

  // ===============================
  // CONTROLES
  // ===============================
  playPauseBtn.addEventListener("click", async () => {
    if (!audio.paused) return audio.pause();
    await audio.play();
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
    startSpectrum();
  });

  audio.addEventListener("pause", () => {
    playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
    stopTimer();
    stopMatrix();
    stopSpectrum();
  });

  // ===============================
  // ZENO LIVE REAL
  // ===============================
  const ZENO_META =
    "https://corsproxy.io/?https://api.zeno.fm/mounts/metadata/ezq3fcuf5ehvv";

  async function checkLiveFromZeno() {
    try {
      const res = await fetch(ZENO_META, { cache: "no-store" });
      const data = await res.json();
      const listeners = Number(data.listeners || 0);
      setLive(listeners > 0);
    } catch {
      setLive(false);
    }
  }

  setInterval(checkLiveFromZeno, 20000);
  checkLiveFromZeno();
});
