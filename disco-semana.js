document.addEventListener("DOMContentLoaded", async () => {
  const player       = document.getElementById("discoPlayer");
  const audio        = document.getElementById("discoAudio");
  const cover        = document.getElementById("discoCover");
  const title        = document.getElementById("discoTitle");
  const playBtn      = document.getElementById("discoPlayBtn");
  const stopBtn      = document.getElementById("discoStopBtn");
  const muteBtn      = document.getElementById("discoMuteBtn");
  const progress     = document.getElementById("discoProgress");
  const currentTimeEl = document.getElementById("discoCurrentTime");
  const durationEl   = document.getElementById("discoDuration");

  let isSeeking = false;

  function formatTime(seconds) {
    if (isNaN(seconds) || !isFinite(seconds) || seconds < 0) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
  }

  function updatePlayUI(isPlaying) {
    player.classList.toggle("playing", isPlaying);
    playBtn.textContent = isPlaying ? "❚❚" : "▶";
  }

  function safeSetDuration() {
    const d = audio.duration;
    if (d && isFinite(d) && !isNaN(d)) {
      progress.max = Math.floor(d);
      durationEl.textContent = formatTime(d);
    }
  }

  // ====== CARGA DEL JSON ======
  async function loadDiscoData() {
    try {
      // Ruta relativa al JSON — debe estar en la misma carpeta que la página
      const res = await fetch("disco-semana/disco.json", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();

      title.textContent = data.titulo || "Disco de la Semana";
      cover.src         = data.portada || "disco-semana/portada.jpg";

      // Usar la URL tal como viene del JSON (debe ser absoluta si viene de GitHub)
      audio.src = data.audio;
      audio.load();

    } catch (err) {
      console.error("Error cargando disco.json:", err);
      title.textContent = "No se pudo cargar el disco de la semana";
    }
  }

  await loadDiscoData();

  // ====== PLAY / PAUSE ======
  async function togglePlay() {
    try {
      // Pausar el stream principal si está reproduciendo
      const mainStream = document.getElementById("radioPlayer") || document.getElementById("audioPlayer");
      if (mainStream && !mainStream.paused) {
        mainStream.pause();
      }

      if (audio.paused) {
        // En iOS el audio.src a veces necesita recargarse si estaba en error
        if (audio.error) {
          audio.load();
          await new Promise(r => audio.addEventListener("canplay", r, { once: true }));
        }
        await audio.play();
        updatePlayUI(true);
      } else {
        audio.pause();
        updatePlayUI(false);
      }
    } catch (err) {
      console.error("Error al reproducir:", err);
      alert("No se pudo reproducir. Verifica que el archivo de audio esté disponible.");
    }
  }

  // ====== BOTONES ======
  function addClickAndTouch(el, fn) {
    el.addEventListener("click", fn);
    el.addEventListener("touchend", (e) => {
      e.preventDefault();
      fn();
    }, { passive: false });
  }

  addClickAndTouch(playBtn, togglePlay);

  addClickAndTouch(stopBtn, () => {
    audio.pause();
    audio.currentTime = 0;
    progress.value = 0;
    currentTimeEl.textContent = "0:00";
    updatePlayUI(false);
  });

  addClickAndTouch(muteBtn, () => {
    audio.muted = !audio.muted;
    muteBtn.textContent = audio.muted ? "🔇" : "🔊";
  });

  // ====== EVENTOS DE AUDIO ======
  audio.addEventListener("play",  () => updatePlayUI(true));
  audio.addEventListener("pause", () => updatePlayUI(false));

  audio.addEventListener("loadedmetadata", safeSetDuration);
  audio.addEventListener("canplay",        safeSetDuration);
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

  audio.addEventListener("error", (e) => {
    console.error("Error de audio:", audio.error, e);
    title.textContent += " ⚠️ Error al cargar audio";
  });

  // ====== SEEK (barra de progreso) ======
  progress.addEventListener("input", () => {
    isSeeking = true;
    currentTimeEl.textContent = formatTime(Number(progress.value));
  });

  progress.addEventListener("change", () => {
    if (isFinite(audio.duration)) {
      audio.currentTime = Number(progress.value);
    }
    isSeeking = false;
  });

  progress.addEventListener("touchstart", () => {
    isSeeking = true;
  }, { passive: true });

  progress.addEventListener("touchend", () => {
    if (isFinite(audio.duration)) {
      audio.currentTime = Number(progress.value);
    }
    isSeeking = false;
  }, { passive: true });
});
