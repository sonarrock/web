document.addEventListener("DOMContentLoaded", () => {
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

  // Seguridad: si no existe el bloque, salir sin romper la web
  if (
    !player ||
    !audio ||
    !cover ||
    !title ||
    !playBtn ||
    !stopBtn ||
    !muteBtn ||
    !progress ||
    !currentTimeEl ||
    !durationEl
  ) {
    console.warn("Disco de la Semana: faltan elementos en el DOM.");
    return;
  }

  let isSeeking = false;
  let discoData = null;

  function formatTime(seconds) {
    if (!isFinite(seconds) || isNaN(seconds) || seconds < 0) return "0:00";
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
    if (isFinite(d) && !isNaN(d) && d > 0) {
      progress.max = Math.floor(d);
      durationEl.textContent = formatTime(d);
    }
  }

  function resetUI() {
    progress.value = 0;
    progress.max = 100;
    currentTimeEl.textContent = "0:00";
    durationEl.textContent = "0:00";
    updatePlayUI(false);
  }

  function setErrorState(msg = "Error al cargar el disco ⚠️") {
    console.warn(msg);
    title.textContent = msg;
    cover.src = "disco-semana/portada.jpg";
    resetUI();
  }

  function normalizeUrl(url) {
    if (!url) return "";
    return url.trim();
  }

  function pauseMainStream() {
    const mainStream =
      document.getElementById("radioPlayer") ||
      document.getElementById("audioPlayer");

    if (mainStream && !mainStream.paused) {
      mainStream.pause();
    }
  }

  async function loadDiscoData() {
    try {
      resetUI();

      const res = await fetch(`disco-semana/disco.json?v=${Date.now()}`, {
        cache: "no-store"
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      discoData = data;

      const discoTitle = data.titulo?.trim() || "Disco de la Semana";
      const coverUrl = normalizeUrl(data.portada) || "disco-semana/portada.jpg";
      const audioUrl = normalizeUrl(data.audio);

      // Título SIEMPRE visible
      title.textContent = discoTitle;

      // Portada
      cover.src = coverUrl;
      cover.alt = discoTitle;

      // Audio
      if (!audioUrl) {
        setErrorState("Falta audio en disco.json ⚠️");
        return;
      }

      audio.src = audioUrl;
      audio.preload = "metadata";
      audio.load();

      console.log("Disco cargado:", discoTitle);
      console.log("Audio URL:", audioUrl);

    } catch (err) {
      console.error("Error cargando disco.json:", err);
      setErrorState("No se pudo cargar el disco de la semana");
    }
  }

  async function ensureAudioReady() {
    if (!audio.src) {
      throw new Error("No hay audio cargado.");
    }

    if (audio.readyState >= 2) return;

    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        cleanup();
        reject(new Error("Tiempo agotado preparando el audio."));
      }, 10000);

      const onReady = () => {
        cleanup();
        resolve();
      };

      const onError = () => {
        cleanup();
        reject(new Error("No se pudo preparar el audio."));
      };

      const cleanup = () => {
        clearTimeout(timeout);
        audio.removeEventListener("canplay", onReady);
        audio.removeEventListener("loadedmetadata", onReady);
        audio.removeEventListener("error", onError);
      };

      audio.addEventListener("canplay", onReady, { once: true });
      audio.addEventListener("loadedmetadata", onReady, { once: true });
      audio.addEventListener("error", onError, { once: true });

      audio.load();
    });
  }

  async function togglePlay() {
    try {
      if (audio.paused) {
        pauseMainStream();
        await ensureAudioReady();
        await audio.play();
        updatePlayUI(true);
      } else {
        audio.pause();
        updatePlayUI(false);
      }
    } catch (err) {
      console.error("Error al reproducir Disco de la Semana:", err);
      title.textContent = discoData?.titulo || "No se pudo reproducir ⚠️";
    }
  }

  // ====== BOTONES ======
  playBtn.addEventListener("click", togglePlay);

  stopBtn.addEventListener("click", () => {
    audio.pause();
    audio.currentTime = 0;
    resetUI();
  });

  muteBtn.addEventListener("click", () => {
    audio.muted = !audio.muted;
    muteBtn.textContent = audio.muted ? "🔇" : "🔊";
  });

  // ====== EVENTOS DE AUDIO ======
  audio.addEventListener("play", () => updatePlayUI(true));
  audio.addEventListener("pause", () => updatePlayUI(false));

  audio.addEventListener("loadedmetadata", safeSetDuration);
  audio.addEventListener("canplay", safeSetDuration);
  audio.addEventListener("durationchange", safeSetDuration);

  audio.addEventListener("timeupdate", () => {
    if (!isSeeking) {
      progress.value = Math.floor(audio.currentTime || 0);
    }
    currentTimeEl.textContent = formatTime(audio.currentTime);
  });

  audio.addEventListener("ended", () => {
    audio.currentTime = 0;
    resetUI();
  });

  audio.addEventListener("error", (e) => {
    console.error("Error de audio:", audio.error, e);
    title.textContent = discoData?.titulo || "Error al cargar el audio ⚠️";
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

  // ====== SI EL PLAYER PRINCIPAL SUENA, PAUSAR ESTE ======
  const mainStream =
    document.getElementById("radioPlayer") ||
    document.getElementById("audioPlayer");

  if (mainStream) {
    mainStream.addEventListener("play", () => {
      if (!audio.paused) {
        audio.pause();
        updatePlayUI(false);
      }
    });
  }

  // ====== CARGA INICIAL ======
  loadDiscoData();
});
