document.addEventListener("DOMContentLoaded", () => {
  const audio = document.getElementById("radio-audio");
  const playBtn = document.getElementById("playPauseBtn");
  const stopBtn = document.getElementById("stop-btn");
  const muteBtn = document.getElementById("mute-btn");
  const volumeSlider = document.getElementById("volume");
  const statusText = document.getElementById("status-text");
  const timerEl = document.getElementById("timer");
  const container = document.querySelector(".player-container");

  const STREAM_URL = "https://stream.zeno.fm/ezq3fcuf5ehvv";

  let timerInterval;
  let reconnectTimer;
  let seconds = 0;
  let isPlaying = false;
  let streamInitialized = false; // indica si ya intentamos cargar el stream (src/ load)
  let userMuted = false; // si el usuario ha tocado mute (para respetar su preferencia)

  /* =========================
     CONFIGURACIÓN BÁSICA
  ========================== */
  // Más agresivo para acelerar primer click
  audio.preload = "auto";
  audio.crossOrigin = "anonymous";
  audio.volume = parseFloat(volumeSlider.value) || 1;

  // Precarga suave del stream en segundo plano (sin reproducir)
  (function precacheStream() {
    if (!streamInitialized) {
      audio.src = STREAM_URL;
      // No hacemos play; solo precargar
      audio.load();
      streamInitialized = true;
    }
  })();

  /* =========================
     UI / ESTADO
  ========================== */
  function updateStatus(status) {
    statusText.textContent = status.toUpperCase();

    if (status === "REPRODUCIENDO") {
      statusText.style.color = "#00ff88";
    } else if (status === "OFFLINE") {
      statusText.style.color = "#ff4d4d";
    } else if (status === "CARGANDO") {
      statusText.style.color = "#ffd166";
    } else {
      statusText.style.color = "#ffffff";
    }
  }

  updateStatus("OFFLINE");

  /* =========================
     TIMER
  ========================== */
  function startTimer() {
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      seconds++;
      const m = String(Math.floor(seconds / 60)).padStart(2, "0");
      const s = String(seconds % 60).padStart(2, "0");
      timerEl.textContent = `${m}:${s}`;
    }, 1000);
  }

  function stopTimer() {
    clearInterval(timerInterval);
    seconds = 0;
    timerEl.textContent = "00:00";
  }

  /* =========================
     RECONEXIÓN AUTOMÁTICA
  ========================== */
  function tryReconnect() {
    clearTimeout(reconnectTimer);

    updateStatus("OFFLINE");
    isPlaying = false;
    container.classList.remove("playing");
    playBtn.classList.remove("loading");
    playBtn.innerHTML = '<i class="fas fa-play"></i>';

    reconnectTimer = setTimeout(() => {
      if (streamInitialized) {
        audio.load();
        audio.play().catch(() => {});
      }
    }, 2000);
  }

  /* =========================
     EVENTOS DE AUDIO
  ========================== */
  audio.addEventListener("waiting", () => {
    updateStatus("CARGANDO");
  });

  audio.addEventListener("playing", () => {
    updateStatus("REPRODUCIENDO");
    playBtn.classList.remove("loading");
    playBtn.innerHTML = '<i class="fas fa-pause"></i>';
    container.classList.add("playing");
    isPlaying = true;
    startTimer();

    // Autoplay seguro: si el usuario no ha tocado mute, desenmute después de iniciar
    // para asegurar audio audible en la mayoría de navegadores.
    if (!userMuted && audio.muted) {
      // Pequeño retardo para que el sonido no se perciba como abrupto
      setTimeout(() => {
        audio.muted = false;
      }, 800);
    }
  });

  audio.addEventListener("pause", () => {
    if (!audio.ended) {
      updateStatus("OFFLINE");
    }
  });

  audio.addEventListener("error", tryReconnect);
  audio.addEventListener("stalled", tryReconnect);
  audio.addEventListener("ended", tryReconnect);

  /* =========================
     CONTROLES
  ========================== */

  // ▶️ Play / Pause
  playBtn.addEventListener("click", () => {
    if (!isPlaying) {

      // 🔥 inicializar stream SOLO la primera vez
      if (!streamInitialized) {
        audio.src = STREAM_URL + "?t=" + Date.now();
        audio.load();
        streamInitialized = true;
      }

      // Pausar otro audio si existe (si aplica)
      const discoAudio = document.getElementById("disco-audio");
      if (discoAudio && !discoAudio.paused) {
        discoAudio.pause();
      }

      // Modo autoplay seguro: tratar de reproducir con mute temporal
      const wasMuted = audio.muted;
      if (!wasMuted) {
        audio.muted = true;
      }

      updateStatus("CARGANDO");
      // Mostrar spinner de carga
      playBtn.classList.add("loading");
      playBtn.innerHTML = '<i class="fas fa-spinner"></i>';

      audio.play().then(() => {
        // Si no estaba muted por el usuario, desmute tras iniciar
        if (!userMuted && audio.muted) {
          setTimeout(() => { audio.muted = false; }, 800);
        }
      }).catch(err => {
        console.warn("Play bloqueado:", err);
        // Revertir estados UI si falla
        audio.muted = wasMuted; // restaurar estado anterior
        playBtn.classList.remove("loading");
        playBtn.innerHTML = '<i class="fas fa-play"></i>';
      });

    } else {
      audio.pause();
      isPlaying = false;
      stopTimer();
      playBtn.classList.remove("loading");
      playBtn.innerHTML = '<i class="fas fa-play"></i>';
      container.classList.remove("playing");
      updateStatus("OFFLINE");
    }
  });

  // ⏹ Stop
  stopBtn.addEventListener("click", () => {
    audio.pause();
    audio.removeAttribute("src");
    audio.load();
    streamInitialized = false;

    // Reset UI
    playBtn.classList.remove("loading");
    playBtn.innerHTML = '<i class="fas fa-play"></i>';
    updateStatus("OFFLINE");
    container.classList.remove("playing");
    isPlaying = false;
    stopTimer();
  });

  // 🔊 Mute
  muteBtn.addEventListener("click", () => {
    audio.muted = !audio.muted;
    // Marca que el usuario ha tocado mute (para respetarlo en autoplay seguro)
    if (audio.muted) {
      userMuted = true;
    }
    muteBtn.innerHTML = audio.muted
      ? '<i class="fas fa-volume-mute"></i>'
      : '<i class="fas fa-volume-up"></i>';
  });

  // 🔊 Volumen
  volumeSlider.addEventListener("input", e => {
    audio.volume = e.target.value;
  });

  /* =========================
     VISIBILIDAD (BACKGROUND)
  ========================== */
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden" && isPlaying) {
      audio.play().catch(() => {});
    }
  });

}); // 👈 ÚNICO cierre de DOMContentLoaded
