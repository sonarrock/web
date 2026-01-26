document.addEventListener("DOMContentLoaded", () => {

  // ==================================================
  // AUDIO CONTEXT (CREADO SOLO CON INTERACCIÓN HUMANA)
  // ==================================================
  let audioCtx = null;
  let analyser = null;
  let source = null;
  let spectrumRAF = null;

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
  const player = document.querySelector(".player-container");
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
      const t = Math.floor((Date.now() - startTime) / 1000);
      const m = String(Math.floor(t / 60)).padStart(2, "0");
      const s = String(t % 60).padStart(2, "0");
      timeDisplay.textContent = `${m}:${s}`;
    }, 1000);
  }

  function stopTimer() {
    clearInterval(timer);
    timer = null;
    timeDisplay.textContent = "00:00";
  }

  // ===============================
  // MATRIX (LLUVIA REAL)
  // ===============================
  const mctx = matrixCanvas.getContext("2d");
  const fontSize = 16;
  let drops = [];
  let matrixRunning = false;
  const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZأ ب ت ث ج ح خ د ذ ر ز س ش ص ض ط ظ ع غ ف ق ك ل م ن ه و ي";

  function resizeMatrix() {
    matrixCanvas.width = player.clientWidth;
    matrixCanvas.height = player.clientHeight;
    drops = Array(Math.floor(matrixCanvas.width / fontSize)).fill(1);
  }

  resizeMatrix();
  window.addEventListener("resize", resizeMatrix);

  function drawMatrix() {
    if (!matrixRunning) return;

    // Fade suave (no borrar completo)
    mctx.fillStyle = "rgba(0,0,0,0.08)";
    mctx.fillRect(0, 0, matrixCanvas.width, matrixCanvas.height);

    mctx.font = `${fontSize}px monospace`;
    mctx.fillStyle = "rgba(0,255,180,0.9)";

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

  // ===============================
  // SPECTRUM CIRCULAR REAL
  // ===============================
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

    spectrumRAF = requestAnimationFrame(drawSpectrum);
  }

  function stopSpectrum() {
    cancelAnimationFrame(spectrumRAF);
    sctx.clearRect(0, 0, spectrumCanvas.width, spectrumCanvas.height);
  }

  // ===============================
  // LIVE STATUS (VISUAL)
  // ===============================
  function setLive(on) {
    liveIndicator.classList.toggle("live", on);
    liveText.textContent = on ? "EN VIVO" : "PROGRAMACIÓN";
  }

  // ===============================
  // CONTROLES (CHROME + iOS SAFE)
  // ===============================
  playPauseBtn.addEventListener("click", async () => {

    // Crear AudioContext SOLO aquí
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;

      source = audioCtx.createMediaElementSource(audio);
      source.connect(analyser);
      analyser.connect(audioCtx.destination);
    }

    if (audioCtx.state === "suspended") {
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
    muteBtn.innerHTML = audio.muted
      ? '<i class="fas fa-volume-mute"></i>'
      : '<i class="fas fa-volume-up"></i>';
  });

  // ===============================
  // EVENTOS DE AUDIO
  // ===============================
  audio.addEventListener("playing", () => {
    playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
    player.classList.add("playing"); // brillo + oscurecer
    startTimer();
    startMatrix();
    drawSpectrum();
  });

  audio.addEventListener("pause", () => {
    playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
    player.classList.remove("playing");
    stopTimer();
    stopMatrix();
    stopSpectrum();
  });

});
