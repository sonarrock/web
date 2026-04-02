document.addEventListener("DOMContentLoaded", () => {
  const audio = document.getElementById("radioPlayer");
  const playBtn = document.getElementById("playBtn");
  const playIcon = document.getElementById("playIcon");
  const shareBtn = document.getElementById("shareBtn");
  const volumeControl = document.getElementById("volumeControl");
  const statusText = document.getElementById("statusText");
  const statusDot = document.getElementById("statusDot");
  const visualizer = document.querySelector(".visualizer");
  const player = document.getElementById("sonarPlayer");

  if (!audio || !playBtn || !playIcon) return;

  const STREAM_URL = "https://stream.zeno.fm/ezq3fcuf5ehvv";

  let isPlaying = false;
  let reconnectTimeout = null;

  // =========================
  // CONFIG INICIAL
  // =========================
  audio.src = STREAM_URL;
  audio.preload = "none";
  audio.playsInline = true;
  audio.crossOrigin = "anonymous";

  // =========================
  // VOLUMEN GUARDADO
  // =========================
  const savedVolume = localStorage.getItem("sonarrock_volume");
  if (savedVolume !== null) {
    audio.volume = parseFloat(savedVolume);
    volumeControl.value = savedVolume;
  } else {
    audio.volume = 1;
    volumeControl.value = 1;
  }

  // =========================
  // HELPERS UI
  // =========================
  function setStatus(text, live = false) {
    statusText.textContent = text;
    statusDot.classList.toggle("live", live);
  }

  function setPlayingUI(playing) {
    isPlaying = playing;
    playIcon.textContent = playing ? "❚❚" : "▶";

    if (visualizer) {
      visualizer.classList.toggle("playing", playing);
    }

    if (player) {
      player.classList.toggle("is-playing", playing);
    }
  }

  function clearReconnect() {
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
      reconnectTimeout = null;
    }
  }

  function tryReconnect() {
    clearReconnect();

    if (!isPlaying) return;

    setStatus("Reconectando señal...", false);

    reconnectTimeout = setTimeout(() => {
      audio.load();
      audio.play().catch(() => {
        setPlayingUI(false);
        setStatus("No se pudo reconectar", false);
      });
    }, 3000);
  }

  // =========================
  // PLAY / PAUSE
  // =========================
  playBtn.addEventListener("click", async () => {
    try {
      if (audio.paused) {
        setStatus("Conectando señal...", false);
        await audio.play();
      } else {
        audio.pause();
      }
    } catch (error) {
      console.error("Error al reproducir:", error);
      setPlayingUI(false);
      setStatus("Toca play para iniciar", false);
    }
  });

  // =========================
  // COMPARTIR
  // =========================
  shareBtn.addEventListener("click", async () => {
    const shareData = {
      title: "Sonar Rock",
      text: "Escucha Sonar Rock - La Radio Independiente 🎸",
      url: window.location.href
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setStatus("Enlace copiado para compartir", false);
        setTimeout(() => {
          if (isPlaying) {
            setStatus("Señal en vivo activa", true);
          } else {
            setStatus("Listo para reproducir", false);
          }
        }, 2500);
      }
    } catch (err) {
      console.warn("Compartir cancelado o no disponible");
    }
  });

  // =========================
  // VOLUMEN
  // =========================
  volumeControl.addEventListener("input", () => {
    const vol = parseFloat(volumeControl.value);
    audio.volume = vol;
    localStorage.setItem("sonarrock_volume", vol);
  });

  // =========================
  // EVENTOS DEL STREAM
  // =========================
  audio.addEventListener("loadstart", () => {
    setStatus("Cargando stream...", false);
  });

  audio.addEventListener("waiting", () => {
    if (isPlaying) {
      setStatus("Buffering en vivo...", false);
    }
  });

  audio.addEventListener("playing", () => {
    clearReconnect();
    setPlayingUI(true);
    setStatus("Señal en vivo activa", true);
  });

  audio.addEventListener("pause", () => {
    clearReconnect();
    setPlayingUI(false);
    setStatus("Pausado", false);
  });

  audio.addEventListener("stalled", () => {
    if (isPlaying) {
      setStatus("Señal interrumpida...", false);
      tryReconnect();
    }
  });

  audio.addEventListener("suspend", () => {
    if (isPlaying) {
      setStatus("Esperando datos...", false);
    }
  });

  audio.addEventListener("error", () => {
    console.error("Error de stream:", audio.error);
    setPlayingUI(false);
    setStatus("Error al conectar señal", false);
    tryReconnect();
  });

  // =========================
  // ESTADO INICIAL
  // =========================
  setStatus("Listo para reproducir", false);
  setPlayingUI(false);
});
