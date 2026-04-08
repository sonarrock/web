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

  // ===============================
  // GUARD CLAUSE
  // ===============================
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

  // ===============================
  // ESTADO
  // ===============================
  let isSeeking = false;
  let discoData = null;
  let touchLock = false;

  // Placeholder neutro para evitar "Cargando..."
  title.textContent = "Disco de la Semana";
  currentTimeEl.textContent = "0:00";
  durationEl.textContent = "0:00";
  progress.value = 0;
  progress.min = 0;
  progress.max = 100;

  // ===============================
  // HELPERS
  // ===============================
  function formatTime(seconds) {
    if (!isFinite(seconds) || isNaN(seconds) || seconds < 0) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
  }

  function updatePlayUI(isPlaying) {
    player.classList.toggle("playing", isPlaying);
    playBtn.textContent = isPlaying ? "❚❚" : "▶";
    playBtn.setAttribute("aria-label", isPlaying ? "Pausar" : "Reproducir");
  }

  function safeSetDuration() {
    const d = audio.duration;
    if (isFinite(d) && !isNaN(d) && d > 0) {
      progress.max = Math.floor(d);
      durationEl.textContent = formatTime(d);
    } else {
      progress.max = 100;
      durationEl.textContent = "0:00";
    }
  }

  function normalizeText(value, fallback = "") {
    return typeof value === "string" && value.trim() ? value.trim() : fallback;
  }

  function buildDisplayTitle(data) {
    const artista = normalizeText(data?.artista);
    const album = normalizeText(data?.album);
    const anio = normalizeText(data?.anio);
    const titulo = normalizeText(data?.titulo);

    if (titulo) return titulo;
    if (artista && album) return `${artista} - ${album}${anio ? ` (${anio})` : ""}`;
    if (album) return album;
    return "Disco de la Semana";
  }

  function setDiscoUI(data) {
    const finalTitle = buildDisplayTitle(data);
    const finalCover = normalizeText(data?.portada, "disco-semana/portada.jpg");
    const finalAudio = normalizeText(data?.audio, "");

    title.textContent = finalTitle;
    title.innerText = finalTitle;

    cover.src = finalCover;
    cover.alt = finalTitle;

    if (finalAudio) {
      audio.src = finalAudio;
      audio.load();
    }
  }

  async function fetchDiscoJson() {
    const response = await fetch(`disco-semana/disco.json?v=${Date.now()}`, {
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return response.json();
  }

  // ===============================
  // CARGA DEL DISCO
  // ===============================
  async function loadDiscoData() {
    try {
      discoData = await fetchDiscoJson();
      setDiscoUI(discoData);
    } catch (error) {
      console.error("Error cargando disco.json:", error);

      title.textContent = "Disco de la Semana";
      title.innerText = "Disco de la Semana";
      cover.src = "disco-semana/portada.jpg";
      cover.alt = "Disco de la Semana";
      audio.removeAttribute("src");
      audio.load();
    }
  }

  // Refuerzo anti-caché móvil / Safari / PWA
  async function reinforceDiscoTitle() {
    try {
      const visibleTitle = normalizeText(title.textContent);

      if (!visibleTitle || visibleTitle === "Cargando..." || visibleTitle === "Disco de la Semana") {
        const freshData = await fetchDiscoJson();
        discoData = freshData;
        setDiscoUI(discoData);
      }
    } catch (error) {
      console.warn("Refuerzo de disco.json no disponible:", error);
    }
  }

  // ===============================
  // AUDIO
  // ===============================
  async function togglePlay() {
    try {
      const mainStream =
        document.getElementById("radioPlayer") ||
        document.getElementById("audioPlayer");

      if (mainStream && !mainStream.paused) {
        mainStream.pause();
      }

      if (!audio.src || audio.src.trim() === "") {
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
    } catch (error) {
      console.error("Error al reproducir Disco de la Semana:", error);
      alert("No se pudo reproducir el disco. Revisa el archivo MP3 o la ruta en disco.json.");
    }
  }

  function stopAudio() {
    audio.pause();
    audio.currentTime = 0;
    progress.value = 0;
    currentTimeEl.textContent = "0:00";
    updatePlayUI(false);
  }

  function toggleMute() {
    audio.muted = !audio.muted;
    muteBtn.textContent = audio.muted ? "🔇" : "🔊";
    muteBtn.setAttribute("aria-label", audio.muted ? "Activar sonido" : "Silenciar");
  }

  // ===============================
  // EVENTOS SEGUROS (SIN DOBLE TAP)
  // ===============================
  function bindTap(el, fn) {
    if (!el) return;

    el.addEventListener("click", (e) => {
      e.preventDefault();
      if (touchLock) return;
      fn();
    });

    el.addEventListener(
      "touchend",
      (e) => {
        e.preventDefault();
        if (touchLock) return;

        touchLock = true;
        fn();

        setTimeout(() => {
          touchLock = false;
        }, 350);
      },
      { passive: false }
    );
  }

  // ===============================
  // BIND CONTROLES
  // ===============================
  bindTap(playBtn, togglePlay);
  bindTap(stopBtn, stopAudio);
  bindTap(muteBtn, toggleMute);

  // ===============================
  // EVENTOS DE AUDIO
  // ===============================
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
    stopAudio();
  });

  audio.addEventListener("error", (e) => {
    console.error("Error de audio Disco de la Semana:", audio.error, e);
    title.textContent = buildDisplayTitle(discoData) + " ⚠️";
  });

  // ===============================
  // SEEK
  // ===============================
  progress.addEventListener("input", () => {
    isSeeking = true;
    currentTimeEl.textContent = formatTime(Number(progress.value));
  });

  progress.addEventListener("change", () => {
    if (isFinite(audio.duration) && !isNaN(audio.duration)) {
      audio.currentTime = Number(progress.value);
    }
    isSeeking = false;
  });

  progress.addEventListener(
    "touchstart",
    () => {
      isSeeking = true;
    },
    { passive: true }
  );

  progress.addEventListener(
    "touchend",
    () => {
      if (isFinite(audio.duration) && !isNaN(audio.duration)) {
        audio.currentTime = Number(progress.value);
      }
      isSeeking = false;
    },
    { passive: true }
  );

  // ===============================
  // INICIO
  // ===============================
  loadDiscoData().then(() => {
    setTimeout(reinforceDiscoTitle, 700);
    setTimeout(reinforceDiscoTitle, 1800);
  });
});
