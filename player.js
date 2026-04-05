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

  const installBtn = document.getElementById("installBtn");
  const installBar = document.getElementById("installBar");

  const songToast = document.getElementById("songToast");
  const toastSong = document.getElementById("toastSong");

  const stationCover = document.getElementById("stationCover");
  const liveBadge = document.getElementById("liveBadge");

  if (!audio || !playBtn) return;

  // =========================
  // CONFIG GISS FINAL
  // =========================
  const STREAM_URL = "https://giss.tv:667/sonarrock.mp3";
  const STATUS_URL = "https://giss.tv:667/status-json.xsl";
  const NOW_PLAYING_URL = "https://giss.tv/player/playing.php?mp=sonarrock.mp3";
  const ARTWORK_URL = "https://giss.tv/player/earp.php?url=https://giss.tv:667/sonarrock.mp3";
  const MOUNTPOINT = "sonarrock.mp3";

  const DEFAULT_TRACK_TEXT = "Transmitiendo rock sin concesiones";
  const DEFAULT_ARTIST_TEXT = "SONAR ROCK";
  const DEFAULT_COVER = "attached_assets/logo_1749601460841.jpeg";

  const STORAGE_VOLUME = "sonarrock_volume";
  const STORAGE_MUTED = "sonarrock_muted";

  let isPlaying = false;
  let reconnectTimer = null;
  let reconnectAttempts = 0;
  let metadataTimer = null;
  let stationCheckTimer = null;
  let deferredPrompt = null;
  let toastTimer = null;

  let lastMetadataTitle = "";
  let lastTrackShown = "";
  let currentCoverUrl = DEFAULT_COVER;
  let stationIsLive = false;

  const maxReconnectAttempts = 8;

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
      if (stationIsLive) {
        setStatus("Transmitiendo en vivo", true);
      } else {
        setStatus("Listo para reproducir", false);
      }
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
  }

  function showSongToast(songTitle) {
    if (!songToast || !toastSong || !songTitle) return;

    toastSong.textContent = songTitle;
    songToast.classList.add("show");

    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      songToast.classList.remove("show");
    }, 3500);
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
      .replace(/^-\s*/, "")
      .replace(/\s*-\s*$/, "")
      .trim();

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
        artist: artist || "",
        title: title || cleaned
      };
    }

    return {
      artist: "",
      title: cleaned || DEFAULT_TRACK_TEXT
    };
  }

  // =========================
  // PORTADA GISS + FALLBACK ITUNES
  // =========================
  async function fetchAlbumArt(artist, title) {
    // 1) Intento con endpoint oficial de GISS
    try {
      const response = await fetch(`${ARTWORK_URL}&t=${Date.now()}`, {
        cache: "no-store"
      });

      if (response.ok) {
        const data = await response.text();
        const artworkUrl = data.trim();

        if (
          artworkUrl &&
          artworkUrl.startsWith("http") &&
          !artworkUrl.includes("noart") &&
          !artworkUrl.includes("default")
        ) {
          setCover(artworkUrl);
          return;
        }
      }
    } catch (error) {
      console.warn("GISS artwork no disponible:", error);
    }

    // 2) Fallback con iTunes
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
  // ESTADO REAL DEL MOUNTPOINT
  // =========================
  function getMountSource(data) {
    const sources = data?.icestats?.source;
    if (!sources) return null;

    if (Array.isArray(sources)) {
      return (
        sources.find((src) => {
          const listen = (src.listenurl || "").toLowerCase();
          const name = (src.server_name || "").toLowerCase();
          return (
            listen.includes(MOUNTPOINT.toLowerCase()) ||
            name.includes("sonarrock")
          );
        }) || null
      );
    }

    return sources;
  }

  async function checkStationLive() {
    try {
      const response = await fetch(`${STATUS_URL}?t=${Date.now()}`, {
        cache: "no-store"
      });

      if (!response.ok) {
        stationIsLive = false;
        if (!isPlaying) setStatus("Señal fuera del aire", false);
        return false;
      }

      const data = await response.json();
      const source = getMountSource(data);

      if (!source || !source.stream_start_iso8601) {
        stationIsLive = false;
        if (!isPlaying) {
          setStatus("Señal fuera del aire", false);
          resetMetadataUI();
        }
        return false;
      }

      stationIsLive = true;

      if (!isPlaying) {
        setStatus("Transmitiendo en vivo", true);
      }

      return true;
    } catch (error) {
      console.warn("No se pudo verificar estado de la estación:", error);
      stationIsLive = false;
      if (!isPlaying) setStatus("Señal no disponible", false);
      return false;
    }
  }

  // =========================
  // METADATA GISS OFICIAL
  // =========================
  async function fetchMetadata() {
    try {
      const live = await checkStationLive();

      if (!live) {
        lastMetadataTitle = "";
        return;
      }

      const response = await fetch(`${NOW_PLAYING_URL}&t=${Date.now()}`, {
        cache: "no-store"
      });

      if (!response.ok) return;

      const rawText = (await response.text()).trim();

      // Si está al aire pero no manda metadata útil
      if (!rawText) {
        updateTrack(DEFAULT_TRACK_TEXT, DEFAULT_ARTIST_TEXT);
        setCover(DEFAULT_COVER);
        return;
      }

      if (rawText !== lastMetadataTitle) {
        lastMetadataTitle = rawText;

        const parsed = parseTitle(rawText);
        const finalArtist = parsed.artist || DEFAULT_ARTIST_TEXT;
        const finalTitle = parsed.title || DEFAULT_TRACK_TEXT;

        updateTrack(finalTitle, finalArtist);

        const nowTrackKey = `${finalArtist} - ${finalTitle}`.trim();

        if (nowTrackKey !== lastTrackShown && lastTrackShown !== "") {
          showSongToast(nowTrackKey);
        }

        lastTrackShown = nowTrackKey;

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

  function startStationCheck() {
    stopStationCheck();
    checkStationLive();
    stationCheckTimer = setInterval(checkStationLive, 15000);
  }

  function stopStationCheck() {
    if (stationCheckTimer) {
      clearInterval(stationCheckTimer);
      stationCheckTimer = null;
    }
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
  // PWA INSTALL
  // =========================
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;

    if (installBar) installBar.style.display = "flex";
    if (installBtn) installBtn.style.display = "inline-flex";
  });

  installBtn?.addEventListener("click", async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;

    if (installBar) installBar.style.display = "none";
  });

  window.addEventListener("appinstalled", () => {
    if (installBar) installBar.style.display = "none";
    deferredPrompt = null;
  });

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

  // Verifica EN VIVO aunque nadie esté escuchando
  startStationCheck();
  fetchMetadata();
});
