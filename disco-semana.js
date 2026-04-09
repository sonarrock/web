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

  if (!player || !audio || !cover || !title || !playBtn || !stopBtn || !muteBtn || !progress || !currentTimeEl || !durationEl) {
    console.warn("Disco de la Semana: faltan elementos en el DOM.");
    return;
  }

  let isSeeking = false;
  let discoData = null;
  let hasLoadedJson = false;

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

  function resetPlayerUI() {
    progress.value = 0;
    currentTimeEl.textContent = "0:00";
    durationEl.textContent = "0:00";
    updatePlayUI(false);
  }

  async function loadDiscoData() {
    try {
      const jsonUrl = `disco-semana/disco.json?v=${Date.now()}`;
      const res = await fetch(jsonUrl, {
        cache: "no-store"
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      discoData = data;
      hasLoadedJson = true;

      const discoTitle = data.titulo?.trim() || "Disco de la Semana";
      const discoCover = data.portada?.trim() || "disco-semana/portada.jpg";
      const discoAudio = data.audio?.trim() || "";

      title.textContent = discoTitle;
      cover.src = discoCover;
      cover.alt = discoTitle;

      if (discoAudio) {
        audio.src = discoAudio;
        audio.load();
      } else {
        console.warn("Disco de la Semana: el JSON no contiene audio.");
      }

    } catch (err) {
      console.error("Error cargando disco.json:", err);
      hasLoadedJson = false;
      title.textContent = "Disco de la Semana";
      cover.src = "disco-semana/portada.jpg";
      cover.alt = "Portada Disco de la Semana";
    }
  }

  await loadDiscoData();

  // Si por alguna razón tarda metadata, al menos nunca dejamos "Cargando..."
  setTimeout(() => {
    if (!hasLoadedJson && title.textContent.trim() === "Cargando...") {
      title.textContent = "Disco de la Semana";
    }
  }, 2500);

  async function togglePlay() {
    try {
      // Pausa el stream principal si está activo
      const mainStream = document.getElementById("radioPlayer") || document.getElementById("audioPlayer");
      if (mainStream && !mainStream.paused) {
        mainStream.pause();
      }

      if (!audio.src) {
        alert("No hay audio cargado en Disco de la Semana.");
        return;
      }

      if (audio.paused) {
        // iPhone / Safari: forzar recarga si hubo error previo
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
      console.error("Error al reproducir el disco:", err);
      alert("No se pudo reproducir el Disco de la Semana. Revisa el archivo MP3 o la ruta del JSON.");
    }
  }

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
    resetPlayerUI();
  });

  bindTap(muteBtn, () => {
    audio.muted = !audio.muted;
    muteBtn.textContent = audio.muted ? "🔇" : "🔊";
  });

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
    audio.currentTime = 0;
    resetPlayerUI();
  });

  audio.addEventListener("error", (e) => {
    console.error("Error de audio:", audio.error, e);
    title.textContent = discoData?.titulo || "Error al cargar el audio ⚠️";
  });

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
