document.addEventListener("DOMContentLoaded", () => {
  const audio = document.getElementById("radioPlayer");
  const playBtn = document.getElementById("playBtn");
  const playIcon = document.getElementById("playIcon");
  const muteBtn = document.getElementById("muteBtn");
  const muteIcon = document.getElementById("muteIcon");
  const volumeControl = document.getElementById("volumeControl");
  const volumeEmoji = document.getElementById("volumeEmoji");
  const statusText = document.getElementById("statusText");
  const statusDot = document.getElementById("statusDot");
  const visualizer = document.getElementById("visualizer");

  if (!audio || !playBtn) return;

  const STREAM_URL = "https://stream.zeno.fm/ezq3fcuf5ehvv";

  audio.src = STREAM_URL;
  audio.volume = 1;
  audio.muted = false;
  audio.preload = "none";
  audio.setAttribute("playsinline", "");
  audio.setAttribute("webkit-playsinline", "");

  let isPlaying = false;

  function setStatus(text, live = false) {
    if (statusText) statusText.textContent = text;
    if (statusDot) {
      statusDot.classList.toggle("live", live);
    }
  }

  function updatePlayUI(playing) {
    isPlaying = playing;
    if (playIcon) playIcon.textContent = playing ? "❚❚" : "▶";
    if (visualizer) visualizer.classList.toggle("playing", playing);
    setStatus(playing ? "Transmitiendo en vivo" : "Listo para reproducir", playing);
  }

  function updateMuteUI() {
    const muted = audio.muted || audio.volume === 0;

    if (muteIcon) muteIcon.textContent = muted ? "🔇" : "🔊";
    if (volumeEmoji) volumeEmoji.textContent = muted ? "🔇" : "🔊";

    if (volumeControl) {
      volumeControl.value = audio.muted ? 0 : audio.volume;
    }
  }

  async function playStream() {
    try {
      setStatus("Conectando con la señal...", false);

      if (audio.src !== STREAM_URL) {
        audio.src = STREAM_URL;
      }

      await audio.play();
      updatePlayUI(true);
    } catch (error) {
      console.error("Error al reproducir stream:", error);
      updatePlayUI(false);
      setStatus("Toca reproducir nuevamente", false);
    }
  }

  function pauseStream() {
    audio.pause();
    updatePlayUI(false);
  }

  playBtn.addEventListener("click", async () => {
    if (audio.paused) {
      await playStream();
    } else {
      pauseStream();
    }
  });

  muteBtn?.addEventListener("click", () => {
    audio.muted = !audio.muted;

    if (!audio.muted && audio.volume === 0) {
      audio.volume = 1;
      if (volumeControl) volumeControl.value = 1;
    }

    updateMuteUI();
  });

  volumeControl?.addEventListener("input", (e) => {
    const value = parseFloat(e.target.value);
    audio.volume = value;
    audio.muted = value === 0;
    updateMuteUI();
  });

  audio.addEventListener("playing", () => {
    updatePlayUI(true);
  });

  audio.addEventListener("pause", () => {
    updatePlayUI(false);
  });

  audio.addEventListener("waiting", () => {
    setStatus("Bufferizando señal...", false);
  });

  audio.addEventListener("stalled", () => {
    setStatus("Reconectando señal...", false);
  });

  audio.addEventListener("loadstart", () => {
    setStatus("Cargando stream...", false);
  });

  audio.addEventListener("error", () => {
    updatePlayUI(false);
    setStatus("Error al conectar con la señal", false);
  });

  audio.addEventListener("volumechange", updateMuteUI);

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && isPlaying && audio.paused) {
      playStream();
    }
  });

  updateMuteUI();
  updatePlayUI(false);
});
