document.addEventListener("DOMContentLoaded", () => {

  /* ===============================
     ELEMENTOS
  =============================== */
  const audio = document.getElementById("radio-audio");
  const playPauseBtn = document.getElementById("playPauseBtn");
  const stopBtn = document.getElementById("stop-btn");
  const muteBtn = document.getElementById("mute-btn");
  const timeDisplay = document.getElementById("time-display");
  const matrixCanvas = document.getElementById("matrixCanvas");
  const spectrumCanvas = document.getElementById("spectrumCanvas");
  const liveIndicator = document.getElementById("live-indicator");
  const player = document.querySelector(".player-container");
  const liveText = liveIndicator.querySelector(".text");

  if (!audio || !player) {
    console.error("❌ Player incompleto");
    return;
  }

  /* ===============================
     AUDIO BASE (CRÍTICO)
  =============================== */
  audio.src = "https://stream.zeno.fm/ezq3fcuf5ehvv";
  audio.crossOrigin = "anonymous";
  audio.preload = "none";
  audio.playsInline = true;

  /* ===============================
     AUDIO CONTEXT
  =============================== */
  let audioCtx = null;
  let analyser = null;
  let source = null;
  let spectrumRAF = null;

  /* ===============================
     TIMER
  =============================== */
  let timer = null;
  let startTime = 0;

  function startTimer() {
    stopTimer();
    startTime = Date.now();
    timer = setInterval(() => {
      const t = Math.floor((Date.now() - startTime) / 1000);
      timeDisplay.textContent =
        `${String(t / 60 | 0).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
    }, 1000);
  }

  function stopTimer() {
    clearInterval(timer);
    timeDisplay.textContent = "00:00";
  }

  /* ===============================
     MATRIX (LLUVIA REAL)
  =============================== */
  const mctx = matrixCanvas.getContext("2d");
  const fontSize = 16;
  const chars = "01ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let drops = [];
  let matrixRunning = false;

  function resizeMatrix() {
    matrixCanvas.width = player.clientWidth;
    matrixCanvas.height = player.clientHeight;
    drops = Array(Math.floor(matrixCanvas.width / fontSize)).fill(1);
  }

  resizeMatrix();
  window.addEventListener("resize", resizeMatrix);

  function drawMatrix() {
    if (!matrixRunning) return;

    mctx.fillStyle = "rgba(0,0,0,0.18)";
    mctx.fillRect(0, 0, matrixCanvas.width, matrixCanvas.height);

    mctx.font = `${fontSize}px monospace`;
    mctx.fillStyle = "rgba(0,255,180,0.95)";

    drops.forEach((y, i) => {
      const char = chars[Math.random() * chars.length | 0];
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

  /* ===============================
     SPECTRUM (SEGURO)
  =============================== */
  const sctx = spectrumCanvas.getContext("2d");

  function resizeSpectrum() {
    spectrumCanvas.width = player.clientWidth;
    spectrumCanvas.height = player.clientHeight;
  }

  resizeSpectrum();
  window.addEventListener("resize", resizeSpectrum);

  function drawSpectrum() {
  if (!analyser) return;

  const data = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteFrequencyData(data);

  sctx.clearRect(0, 0, spectrumCanvas.width, spectrumCanvas.height);

  const cx = spectrumCanvas.width / 2;
  const cy = spectrumCanvas.height / 2;
  const r = Math.min(cx, cy) * 0.35;

  // ===============================
  // DIBUJO DEL ESPECTRO
  // ===============================
  for (let i = 0; i < 120; i++) {
    const v = data[i] / 255;
    const a = (i / 120) * Math.PI * 2;

    sctx.strokeStyle = `rgba(0,180,255,${0.4 + v})`;
    sctx.lineWidth = 2;
    sctx.beginPath();
    sctx.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    sctx.lineTo(
      cx + Math.cos(a) * (r + v * r),
      cy + Math.sin(a) * (r + v * r)
    );
    sctx.stroke();
  }

  // ===============================
  // GLOW SEGÚN VOLUMEN REAL
  // ===============================
  let sum = 0;
  for (let i = 0; i < 80; i++) sum += data[i];
  const avg = sum / 80 / 255;

  if (avg > 0.05) {
    const intensity = Math.min(1, avg * 2.5);
    player.classList.add("glow");
   const color = liveIndicator.classList.contains("live")
  ? `255,60,60`
  : `0,180,255`;

player.style.boxShadow = `
  0 0 ${20 + intensity * 50}px rgba(${color},${0.3 + intensity}),
  inset 0 0 ${10 + intensity * 30}px rgba(${color},${0.15 + intensity * 0.5})
`;

  } else {
    player.classList.remove("glow");
    player.style.boxShadow = "none";
  }

  spectrumRAF = requestAnimationFrame(drawSpectrum);
}

  /* ===============================
     LIVE STATUS (VISUAL)
  =============================== */
  function setLive(on) {
    liveIndicator.classList.toggle("live", on);
    liveText.textContent = on ? "EN VIVO" : "PROGRAMACIÓN";
  }

  /* ===============================
     CONTROLES (CHROME SAFE)
  =============================== */
  playPauseBtn.addEventListener("click", async () => {

    if (!audioCtx) {
      try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 512;

        source = audioCtx.createMediaElementSource(audio);
        source.connect(analyser);
        analyser.connect(audioCtx.destination);

      } catch (e) {
        console.warn("⚠️ WebAudio bloqueado, audio directo");
        audioCtx = null;
        analyser = null;
      }
    }

    if (audioCtx && audioCtx.state === "suspended") {
      await audioCtx.resume();
    }

    if (audio.paused) {
      await audio.play();
    } else {
      audio.pause();
    }
  });

  stopBtn.addEventListener("click", () => {
    audio.pause();
    audio.currentTime = 0;
  });

  muteBtn.addEventListener("click", () => {
    audio.muted = !audio.muted;
  });

  /* ===============================
     EVENTOS AUDIO
  =============================== */
  audio.addEventListener("playing", () => {
    playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
    player.classList.add("playing");
    startTimer();
    startMatrix();
    drawSpectrum();
    setLive(true);
  });

  audio.addEventListener("pause", () => {
    playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
    player.classList.remove("playing");
    stopTimer();
    stopMatrix();
    cancelAnimationFrame(spectrumRAF);
  });

});
