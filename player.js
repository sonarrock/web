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
  const trackTitleLive = document.getElementById("trackTitleLive");
  const stationCover = document.getElementById("stationCover");
  const miniPlayer = document.getElementById("miniPlayer");

  if (!audio || !playBtn) return;

  // =========================
  // CONFIG
  // =========================
  const STREAM_URL = "https://stream.zeno.fm/ezq3fcuf5ehvv";

  // ESTE SERÁ TU PROXY PHP
  const METADATA_URL = "/metadata.php";

  // Si GISS tiene tu estación identificable, ajusta esto si hace falta
  const STATION_MATCHERS = [
    "sonarrock",
    "sonar rock",
    "ezq3fcuf5ehvv"
  ];

  const DEFAULT_TRACK_TEXT = "Transmitiendo rock sin concesiones";
  const DEFAULT_ARTIST_TEXT = "Sonar Rock";
  const DEFAULT_COVER = "attached_assets/logo_1749601460841.jpeg";

  const STORAGE_VOLUME = "sonarrock_volume";
  const STORAGE_MUTED = "sonarrock_muted";

  let isPlaying = false;
  let reconnectTimer = null;
  let reconnectAttempts = 0;
  let metadataTimer = null;
  let lastTrackRaw = "";
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
    if (player) player.classList.toggle("is-live", live);
  }

  function updatePlayUI(playing) {
    isPlaying = playing;

    if (playIcon) playIcon.textContent = playing ? "❚❚" : "▶";
    if (miniPlayIcon) miniPlayIcon.textContent = playing ? "❚❚" : "▶";

    if (player) player.classList.toggle("playing", playing);

    setStatus(playing ? "Transmitiendo en vivo" : "Listo para reproducir", playing);

    if (!playing) {
      stopMetadataPolling();
      resetTrackDisplay();
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

  function resetTrackDisplay() {
    if (trackArtist) trackArtist.textContent = DEFAULT_ARTIST_TEXT;
    if (trackTitleLive) trackTitleLive.textContent = DEFAULT_TRACK_TEXT;
    if (trackInfo) trackInfo.textContent = DEFAULT_TRACK_TEXT;
    if (stationCover) stationCover.src = DEFAULT_COVER;
  }

  function updateTrackUI(artist, title, raw) {
    const safeArtist = artist?.trim() || DEFAULT_ARTIST_TEXT;
    const safeTitle = title?.trim() || DEFAULT_TRACK_TEXT;
    const safeRaw = raw?.trim() || `${safeArtist} - ${safeTitle}`;

    if (trackArtist) trackArtist.textContent = safeArtist;
    if (trackTitleLive) trackTitleLive.textContent = safeTitle;
    if (trackInfo) trackInfo.textContent = safeRaw;
    if (miniStatus) miniStatus.textContent = safeTitle;
  }

  // =========================
  // LIMPIEZA METADATA
  // =========================
  function cleanTitle(title = "") {
    return title
      .replace(/^NOW:\s*/i, "")
      .replace(/_/g, "'")
      .replace(/\s+/g, " ")
      .replace(/\|/g, " - ")
      .trim();
  }

  function parseTrack(rawTitle = "") {
    const cleaned = cleanTitle(rawTitle);

    if (!cleaned) {
      return {
        artist: DEFAULT_ARTIST_TEXT,
        title: DEFAULT_TRACK_TEXT,
        raw: DEFAULT_TRACK_TEXT
      };
    }

    if (cleaned.includes(" - ")) {
      const parts = cleaned.split(" - ");
      const artist = parts[0]?.trim() || DEFAULT_ARTIST_TEXT;
      const title = parts.slice(1).join(" - ").trim() || DEFAULT_TRACK_TEXT;

      return { artist, title, raw: cleaned };
    }

    return {
      artist: DEFAULT_ARTIST_TEXT,
      title: cleaned,
      raw: cleaned
    };
  }

  function isLikelyOurStation(source) {
    const haystack = [
      source?.listenurl,
      source?.server_name,
      source?.server_description,
      source?.title,
      source?.server_url
    ]
      .join(" ")
      .toLowerCase();

    return STATION_MATCHERS.some(match => haystack.includes(match));
  }

  // =========================
  // COVER ART
  // =========================
  async function updateCover(artist, title) {
    if (!artist && !title) {
      if (stationCover) stationCover.src = DEFAULT_COVER;
      return;
    }

    try {
      const query = encodeURIComponent(`${artist} ${title}`);
      const res = await fetch(`https://itunes.apple.com/search?term=${query}&entity=song&limit=1`);
      const data = await res.json();

      if (data?.results?.length > 0) {
        const artwork = data.results[0].artworkUrl100?.replace("100x100", "600x600");
        if (artwork && stationCover) {
          stationCover.src = artwork;
          return;
        }
      }

      if (stationCover) stationCover.src = DEFAULT_COVER;
    } catch (error) {
      console.warn("No se pudo actualizar portada:", error);
      if (stationCover) stationCover.src = DEFAULT_COVER;
    }
  }

  // =========================
  // METADATA
  // =========================
  async function fetchMetadata() {
    if (!METADATA_URL) return;

    try {
      const response = await fetch(`${METADATA_URL}?t=${Date.now()}`, {
        cache: "no-store"
      });

      if (!response.ok) return;

      const data = await response.json();

      let sources = data?.icestats?.source || [];
      if (!Array.isArray(sources)) sources = [sources];

      let station = sources.find(isLikelyOurStation);

      if (!station && sources.length > 0) {
        station = sources[0];
      }

      if (!station) return;

      const rawTitle =
        station?.title ||
        station?.artist ||
        station?.server_name ||
        "";

      if (!rawTitle || rawTitle === lastTrackRaw) return;

      lastTrackRaw = rawTitle;

      const parsed = parseTrack(rawTitle);

      updateTrackUI(parsed.artist, parsed.title, parsed.raw);
      updateCover(parsed.artist, parsed.title);
    } catch (error) {
      console.warn("Metadata no disponible:", error);
    }
  }

  function startMetadataPolling() {
    stopMetadataPolling();

    fetchMetadata();
    metadataTimer = setInterval(fetchMetadata, 15000);
  }

  function stopMetadataPolling() {
    if (metadataTimer) {
      clearInterval(metadataTimer);
      metadataTimer = null;
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
  resetTrackDisplay();
});
