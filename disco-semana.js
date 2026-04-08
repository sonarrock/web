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

  // Si no existe el bloque en la página, no hacemos nada
  if (!player || !audio || !cover || !title || !playBtn || !stopBtn || !muteBtn || !progress || !currentTimeEl || !durationEl) {
    console.warn("Disco de la Semana: faltan elementos en el DOM.");
    return;
  }

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
      const res = await fetch("disco-semana/disco.json?v=" + Date.now(), {
        cache: "no-store"
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();

      title.textContent = data.titulo || "Disco de la Semana";
      cover.src = data.portada || "disco-semana/portada.jpg";
      cover.alt = data.titulo || "Portada Disco de la Semana";

      // IMPORTANTE:
      // Si en el JSON pones una ruta relativa, la respetará.
      // Si pones absoluta, también funciona.
      audio.src = data.audio || "";
      audio.load();

    } catch (err) {
      console.error("Error cargando disco.json:", err);
      title.textContent = "No se pudo cargar el disco de la semana";
      cover.src = "disco-semana/portada.jpg";
    }
  }

  await loadDiscoData();

  // ====== PLAY / PAUSE ======
  async function togglePlay() {
    try {
      // Pausar stream principal si está sonando
      const mainStream = document.getElementById("radioPlayer") || document.getElementById("audioPlayer");
      if (mainStream && !mainStream.paused) {
        mainStream.pause();
      }

      if (!audio.src) {
        alert("No hay audio cargado en Disco de la Semana.");
        return;
      }

      if (audio.paused) {
        if (audio.error) {
          audio.load();
          await new Promise((resolve) => {
            audio.addEventListener("canplay", resolve, { once: true });
          });
        }

        await audio.play();
        updatePlayUI(true);
      } else {
        audio.pause();
        updatePlayUI(false);
      }
    } catch (err) {
      console.error("Error al reproducir:", err);
      alert("No se pudo reproducir el disco. Revisa el archivo de audio o la ruta en disco.json.");
    }
  }

  // ====== EVENTOS DE BOTONES ======
  function bindTap(el, fn) {
    if (!el) return;

    el.addEventListener("click", fn);

    el.addEventListener("touchend", (e) => {
      e.preventDefault();
      fn();
    }, { passive: false });
  }

  bindTap(playBtn, togglePlay);

  bindTap(stopBtn, () => {
    audio.pause();
    audio.currentTime = 0;
    progress.value = 0;
    currentTimeEl.textContent = "0:00";
    updatePlayUI(false);
  });

  bindTap(muteBtn, () => {
    audio.muted = !audio.muted;
    muteBtn.textContent = audio.muted ? "🔇" : "🔊";
  });

  // ====== EVENTOS DE AUDIO ======
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

  audio.addEventListener("error", (e) => {
    console.error("Error de audio:", audio.error, e);
    title.textContent = "Error al cargar el audio ⚠️";
  });

  // ====== SEEK ======
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
