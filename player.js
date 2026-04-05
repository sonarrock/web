document.addEventListener("DOMContentLoaded", () => {
  const audio = document.getElementById("radioPlayer");
  const player = document.getElementById("sonarPlayer");

  const playBtn = document.getElementById("playBtn");
  const playIcon = document.getElementById("playIcon");

  const miniPlayBtn = document.getElementById("miniPlayBtn");
  const miniPlayIcon = document.getElementById("miniPlayIcon");

  const muteBtn = document.getElementById("muteBtn");
  const muteIcon = document.getElementById("muteIcon");

  const volumeControl = document.getElementById("volumeControl");
  const volumeEmoji = document.getElementById("volumeEmoji");

  const statusText = document.getElementById("statusText");
  const statusDot = document.getElementById("statusDot");
  const miniStatus = document.getElementById("miniStatus");
  const miniLiveDot = document.getElementById("miniLiveDot");

  const trackInfo = document.getElementById("trackInfo");
  const trackArtist = document.getElementById("trackArtist");
  const miniPlayer = document.getElementById("miniPlayer");

  const stationCover = document.getElementById("stationCover");
  const liveBadge = document.getElementById("liveBadge");

  if (!audio || !playBtn) return;

  // =========================
  // CONFIG
  // =========================
  const STREAM_URL = "https://giss.tv:667/sonarrock.mp3";
  const METADATA_URL = "https://giss.tv:667/status-json.xsl";
  const MOUNTPOINT = "sonarrock.mp3";

  const DEFAULT_TRACK_TEXT = "Transmitiendo rock sin concesiones";
  const DEFAULT_ARTIST_TEXT = "Señal lista";
  const DEFAULT_COVER = "attached_assets/logo_1749601460841.jpeg";

  const STORAGE_VOLUME = "sonarrock_volume";
  const STORAGE_MUTED = "sonarrock_muted";

  const maxReconnectAttempts = 8;

  let isPlaying = false;
  let reconnectTimer = null;
  let reconnectAttempts = 0;
  let metadataTimer = null;
  let backgroundMetadataTimer = null;
  let lastMetadataTitle = "";
  let currentCoverUrl = DEFAULT_COVER;

  audio.src = STREAM_URL;
  audio.preload = "none";
  audio.setAttribute("playsinline", "");
  audio.setAttribute("webkit-playsinline", "");
  audio.crossOrigin = "anonymous";

  // =========================
  // CARGAR CONFIG GUARDADA
  // =========================
  const savedVolume = localStorage.getItem(STORAGE_VOLUME);
  const savedMuted = localStorage.getItem(STORAGE_MUTED);

  audio.volume = savedVolume !== null ? parseFloat(savedVolume) : 1;
  audio.muted = savedMuted === "true";

  if (volumeControl) {
    volumeControl.value = audio.muted ? 0 : audio.volume;
  }

  // =========================
  // HELPERS UI
  // =========================
  function setStatus(text, live = false) {
    if (statusText) statusText.textContent = text;
    if (miniStatus) miniStatus.textContent = text;

    if (statusDot) statusDot.classList.toggle("live", live);
    if (miniLiveDot) miniLiveDot.classList.toggle("live", live);
    if (liveBadge) liveBadge.classList.toggle("live", live);
    if (player) player.classList.toggle("is-live", live);
  }

  function updateTrack(title, artist = DEFAULT_ARTIST_TEXT) {
    if (trackInfo) trackInfo.textContent = title || DEFAULT_TRACK_TEXT;
    if (trackArtist) trackArtist.textContent = artist || DEFAULT_ARTIST_TEXT;
  }

  function updatePlayUI(playing) {
    isPlaying = playing;

    if (playIcon) playIcon.textContent = playing ? "❚❚" : "▶";
    if (miniPlayIcon) miniPlayIcon.textContent = playing ? "❚❚" : "▶";

    if (player) player.classList.toggle("playing", playing);

    if (!playing) {
      setStatus("Listo para reproducir", false);
      stopMetadataPolling();
    }
  }

  function updateMuteUI() {
    const muted = audio.muted || audio.volume === 0;

    if (muteIcon) muteIcon.textContent = muted ? "🔇" : "🔊";
    if (volumeEmoji) volumeEmoji.textContent = muted ? "🔇" : "🔊";

    if (volumeControl) {
      volumeControl.value = audio.muted ? 0 : audio.volume;
    }
  }

  function saveAudioPrefs() {
    localStorage.setItem(STORAGE_VOLUME, audio.volume.toString());
    localStorage.setItem(STORAGE_MUTED, audio.muted.toString());
  }

  function clearReconnect() {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  }

  function setCover(url) {
    if (!stationCover) return;

    const finalUrl = url || DEFAULT_COVER;
    if (finalUrl === currentCoverUrl) return;

    stationCover.style.opacity = "0.55";

    const img = new Image();
    img.onload = () => {
      stationCover.src = finalUrl;
      currentCoverUrl = finalUrl;
      stationCover.style.opacity = "1";
    };
    img.onerror = () => {
      stationCover.src = DEFAULT_COVER;
      currentCoverUrl = DEFAULT_COVER;
      stationCover.style.opacity = "1";
    };
    img.src = finalUrl;
  }

  function resetMetadataUI() {
    updateTrack(DEFAULT_TRACK_TEXT, DEFAULT_ARTIST_TEXT);
    setCover(DEFAULT_COVER);
    lastMetadataTitle = "";
  }

  // =========================
  // PARSE TITLE
  // =========================
  function parseTitle(rawTitle = "") {
    if (!rawTitle || typeof rawTitle !== "string") {
      return {
        artist: "",
        title: DEFAULT_TRACK_TEXT
      };
    }

    const cleaned = rawTitle
      .replace(/\s+/g, " ")
      .replace(/^NOW:\s*/i, "")
      .trim();

    if (
      cleaned === "-" ||
      cleaned === "- ," ||
      cleaned === "," ||
      cleaned.toLowerCase() === "undefined"
    ) {
      return {
        artist: "SONAR ROCK",
        title: DEFAULT_TRACK_TEXT
      };
    }

    const separators = [" - ", " – ", " — "];
    let parts = null;

    for (const sep of separators) {
      if (cleaned.includes(sep)) {
        parts = cleaned.split(sep);
        break;
      }
    }

    if (parts && parts.length >= 2) {
      const artist = parts.shift().trim();
      const title = parts.join(" - ").trim();

      return {
        artist: artist || "SONAR ROCK",
        title: title || DEFAULT_TRACK_TEXT
      };
    }

    return {
      artist: "SONAR ROCK",
      title: cleaned || DEFAULT_TRACK_TEXT
    };
  }

  // =========================
  // PORTADA (ITUNES)
  // =========================
  async function fetchAlbumArt(artist, title) {
    if (!artist && !title) {
      setCover(DEFAULT_COVER);
      return;
    }

    try {
      const query = encodeURIComponent(`${artist} ${title}`.trim());
      const url = `https://itunes.apple.com/search?term=${query}&entity=song&limit=1`;

      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) {
        setCover(DEFAULT_COVER);
        return;
      }

      const data = await response.json();
      const result = data?.results?.[0];

      if (result?.artworkUrl100) {
        const hiResCover = result.artworkUrl100.replace("100x100bb", "600x600bb");
        setCover(hiResCover);
      } else {
        setCover(DEFAULT_COVER);
      }
    } catch (error) {
      console.warn("No se pudo cargar portada:", error);
      setCover(DEFAULT_COVER);
    }
  }

  // =========================
  // METADATA GISS / ICECAST
  // =========================
  function getMountSource(data) {
    const sources = data?.icestats?.source;
    if (!sources) return null;

    if (Array.isArray(sources)) {
      return (
        sources.find((src) => {
          const listen = (src.listenurl || "").toLowerCase();
          const name = (src.server_name || "").toLowerCase();
          const desc = (src.server_description || "").toLowerCase();

          return (
            listen.includes(MOUNTPOINT.toLowerCase()) ||
            name.includes("sonar rock") ||
            name.includes("sonarrock") ||
            desc.includes("sonar rock")
          );
        }) || null
      );
    }

    return sources;
  }

  async function fetchMetadata() {
    try {
      const response = await fetch(`${METADATA_URL}?t=${Date.now()}`, {
        cache: "no-store"
      });

      if (!response.ok) return;

      const data = await response.json();
      const source = getMountSource(data);

      if (!source) {
        setStatus("Señal fuera del aire", false);
        resetMetadataUI();
        return;
      }

      const isReallyLive =
        !!source.stream_start_iso8601 ||
        !!source.listenurl ||
        !!source.server_name;

      if (!isReallyLive) {
        setStatus("Señal fuera del aire", false);
        resetMetadataUI();
        return;
      }

      setStatus("Transmitiendo en vivo", true);

      const rawTitle =
        source.title ||
        source.artist ||
        source.server_description ||
        DEFAULT_TRACK_TEXT;

      const parsed = parseTitle(rawTitle);

      updateTrack(parsed.title, parsed.artist || "SONAR ROCK");

      if (rawTitle !== lastMetadataTitle) {
        lastMetadataTitle = rawTitle;
        fetchAlbumArt(parsed.artist, parsed.title);
      }
    } catch (error) {
      console.warn("Metadata no disponible:", error);
    }
  }

  function startMetadataPolling() {
    stopMetadataPolling();
    fetchMetadata();
    metadataTimer = setInterval(fetchMetadata, 12000);
  }

  function stopMetadataPolling() {
    if (metadataTimer) {
      clearInterval(metadataTimer);
      metadataTimer = null;
    }
  }

  function startBackgroundMetadataPolling() {
    if (backgroundMetadataTimer) clearInterval(backgroundMetadataTimer);
    fetchMetadata();
    backgroundMetadataTimer = setInterval(fetchMetadata, 15000);
  }

  // =========================
  // RECONEXIÓN
  // =========================
  function scheduleReconnect() {
    if (!isPlaying) return;

    if (reconnectAttempts >= maxReconnectAttempts) {
      setStatus("No se pudo reconectar la señal", false);
      updatePlayUI(false);
      return;
    }

    clearReconnect();
    reconnectAttempts++;

    setStatus(`Reconectando señal... (${reconnectAttempts})`, false);

    reconnectTimer = setTimeout(async () => {
      try {
        audio.src = STREAM_URL + "?t=" + Date.now();
        await audio.play();
      } catch (error) {
        console.error("Reconexión fallida:", error);
        scheduleReconnect();
      }
    }, 2500);
  }

  // =========================
  // PLAY / PAUSE
  // =========================
  async function playStream() {
    try {
      clearReconnect();
      reconnectAttempts = 0;
      setStatus("Conectando con la señal...", false);

      audio.src = STREAM_URL + "?t=" + Date.now();
      await audio.play();

      updatePlayUI(true);
      startMetadataPolling();
    } catch (error) {
      console.error("Error al reproducir stream:", error);
      updatePlayUI(false);
      setStatus("Toca reproducir nuevamente", false);
    }
  }

  function pauseStream() {
    clearReconnect();
    stopMetadataPolling();
    audio.pause();
    updatePlayUI(false);
  }

  function togglePlay() {
    if (audio.paused) {
      playStream();
    } else {
      pauseStream();
    }
  }

  // =========================
  // EVENTOS BOTONES
  // =========================
  playBtn.addEventListener("click", togglePlay);
  miniPlayBtn?.addEventListener("click", togglePlay);

  muteBtn?.addEventListener("click", () => {
    audio.muted = !audio.muted;

    if (!audio.muted && audio.volume === 0) {
      audio.volume = 1;
      if (volumeControl) volumeControl.value = 1;
    }

    updateMuteUI();
    saveAudioPrefs();
  });

  volumeControl?.addEventListener("input", (e) => {
    const value = parseFloat(e.target.value);

    audio.volume = value;
    audio.muted = value === 0;

    updateMuteUI();
    saveAudioPrefs();
  });

  // =========================
  // EVENTOS AUDIO
  // =========================
  audio.addEventListener("playing", () => {
    clearReconnect();
    reconnectAttempts = 0;
    updatePlayUI(true);
    startMetadataPolling();
  });

  audio.addEventListener("pause", () => {
    if (!reconnectTimer) {
      updatePlayUI(false);
    }
  });

  audio.addEventListener("waiting", () => {
    if (isPlaying) setStatus("Bufferizando señal...", false);
  });

  audio.addEventListener("stalled", () => {
    if (isPlaying) {
      setStatus("Señal detenida, reconectando...", false);
      scheduleReconnect();
    }
  });

  audio.addEventListener("suspend", () => {
    if (isPlaying) {
      setStatus("Señal suspendida, reconectando...", false);
      scheduleReconnect();
    }
  });

  audio.addEventListener("error", () => {
    console.error("Error en stream");
    if (isPlaying) {
      setStatus("Error en la señal, reconectando...", false);
      scheduleReconnect();
    } else {
      updatePlayUI(false);
      setStatus("Error al conectar con la señal", false);
    }
  });

  audio.addEventListener("loadstart", () => {
    if (isPlaying) setStatus("Cargando stream...", false);
  });

  audio.addEventListener("volumechange", updateMuteUI);

  // =========================
  // VISIBILIDAD / iPHONE
  // =========================
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && isPlaying && audio.paused) {
      playStream();
    }
  });

  // =========================
  // MINI PLAYER MÓVIL
  // =========================
  function handleMiniPlayer() {
    if (!miniPlayer) return;

    if (window.innerWidth <= 768) {
      miniPlayer.classList.add("show");
    } else {
      miniPlayer.classList.remove("show");
    }
  }

  window.addEventListener("resize", handleMiniPlayer);
  handleMiniPlayer();

  // =========================
  // INIT
  // =========================
  updateMuteUI();
  updatePlayUI(false);
  resetMetadataUI();
  startBackgroundMetadataPolling();
});
