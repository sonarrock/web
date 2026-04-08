document.addEventListener("DOMContentLoaded", async () => {
  const player = document.getElementById("discoPlayer");
  const audio = document.getElementById("discoAudio");
  const cover = document.getElementById("discoCover");
  const title = document.getElementById("discoTitle");

  const playBtn = document.getElementById("discoPlayBtn");
  const stopBtn = document.getElementById("discoStopBtn");
  const muteBtn = document.getElementById("discoMuteBtn");
  const progress = document.getElementById("discoProgress");
  const currentTimeEl = document.getElementById("discoCurrentTime");
  const durationEl = document.getElementById("discoDuration");

  let isSeeking = false;

  function formatTime(seconds) {
    if (isNaN(seconds) || seconds === Infinity) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
  }

  function updatePlayUI(isPlaying) {
    player.classList.toggle("playing", isPlaying);
    playBtn.textContent = isPlaying ? "❚❚" : "▶";
  }

  function safeSetDuration() {
    if (!isNaN(audio.duration) && isFinite(audio.duration)) {
      progress.max = Math.floor(audio.duration);
      durationEl.textContent = formatTime(audio.duration);
    }
  }

  async function loadDiscoData() {
    try {
      const res = await fetch("disco-semana/disco.json", { cache: "no-store" });
      if (!res.ok) throw new Error("No se pudo cargar disco.json");

      const data = await res.json();

      title.textContent = data.titulo || "Disco de la Semana";
      cover.src = data.portada || "disco-semana/portada.jpg";

      // IMPORTANTE: usar ruta absoluta evita broncas en Safari si la página cambia de carpeta
      const audioUrl = new URL(data.audio, window.location.origin + "/").href;
      audio.src = audioUrl;
      audio.load();

      console.log("Disco cargado:", data);
      console.log("Audio URL:", audioUrl);
    } catch (err) {
      console.error("Error cargando disco.json:", err);
      title.textContent = "No se pudo cargar el disco de la semana";
    }
  }

  await loadDiscoData();

  // ====== PLAY / PAUSE ======
  async function togglePlay() {
    try {
      // Si tienes el stream principal, aquí lo pausas para evitar doble audio
      const mainStream = document.getElementById("radioPlayer") || document.getElementById("audioPlayer");
      if (mainStream && !mainStream.paused) {
        mainStream.pause();
      }

      if (audio.paused) {
        await audio.play();
        updatePlayUI(true);
      } else {
        audio.pause();
        updatePlayUI(false);
      }
    } catch (err) {
      console.error("Error al reproducir en iPhone/Safari:", err);
      alert("Safari bloqueó la reproducción o el archivo no es compatible. Revisa el formato del audio.");
    }
  }

  // Click
  playBtn.addEventListener("click", togglePlay);

  // Touch extra para iPhone (más robusto)
  playBtn.addEventListener("touchend", (e) => {
    e.preventDefault();
    togglePlay();
  }, { passive: false });

  stopBtn.addEventListener("click", () => {
    audio.pause();
    audio.currentTime = 0;
    progress.value = 0;
    currentTimeEl.textContent = "0:00";
    updatePlayUI(false);
  });

  stopBtn.addEventListener("touchend", (e) => {
    e.preventDefault();
    audio.pause();
    audio.currentTime = 0;
    progress.value = 0;
    currentTimeEl.textContent = "0:00";
    updatePlayUI(false);
  }, { passive: false });

  muteBtn.addEventListener("click", () => {
    audio.muted = !audio.muted;
    muteBtn.textContent = audio.muted ? "🔇" : "🔊";
  });

  muteBtn.addEventListener("touchend", (e) => {
    e.preventDefault();
    audio.muted = !audio.muted;
    muteBtn.textContent = audio.muted ? "🔇" : "🔊";
  }, { passive: false });

  // ====== EVENTOS AUDIO ======
  audio.addEventListener("play", () => updatePlayUI(true));
  audio.addEventListener("pause", () => updatePlayUI(false));

  audio.addEventListener("loadedmetadata", safeSetDuration);
  audio.addEventListener("canplay", safeSetDuration);
  audio.addEventListener("canplaythrough", safeSetDuration);
  audio.addEventListener("durationchange", safeSetDuration);

  audio.addEventListener("timeupdate", () => {
    if (!isSeeking) {
      progress.value = Math.floor(audio.currentTime || 0);
    }
    currentTimeEl.textContent = formatTime(audio.currentTime);
  });

  audio.addEventListener("ended", () => {
    updatePlayUI(false);
    progress.value = 0;
    currentTimeEl.textContent = "0:00";
  });

  audio.addEventListener("error", () => {
    console.error("Error de audio:", audio.error);
    alert("El audio no pudo reproducirse en este dispositivo. Revisa formato/ruta.");
  });

  // ====== SEEK ======
  progress.addEventListener("input", () => {
    isSeeking = true;
    currentTimeEl.textContent = formatTime(progress.value);
  });

  progress.addEventListener("change", () => {
    audio.currentTime = Number(progress.value);
    isSeeking = false;
  });

  progress.addEventListener("touchstart", () => {
    isSeeking = true;
  }, { passive: true });

  progress.addEventListener("touchend", () => {
    audio.currentTime = Number(progress.value);
    isSeeking = false;
  }, { passive: true });
});