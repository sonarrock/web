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

  const songToast = document.getElementById("songToast");
  const toastSong = document.getElementById("toastSong");

  const stationCover = document.getElementById("stationCover");
  const vuCanvas = document.getElementById("vuCanvas");

  if (!audio || !playBtn) return;

  // =========================
  // CONFIG
  // =========================
  const STREAM_URL = "https://giss.tv:667/sonarrock.mp3";
  const METADATA_URL = "https://giss.tv:667/status-json.xsl";
  const GISS_NOWPLAYING_URL = "https://giss.tv/player/playing.php?mp=sonarrock.mp3";
  const MOUNTPOINT = "sonarrock.mp3";

  const DEFAULT_TRACK_TEXT = "Transmitiendo rock sin concesiones";
  const DEFAULT_ARTIST_TEXT = "Señal lista";
  const DEFAULT_COVER = "attached_assets/logo_1749601460841.jpeg";

  const STORAGE_VOLUME = "sonarrock_volume";
  const STORAGE_MUTED = "sonarrock_muted";

  const maxReconnectAttempts = 6;
  const reconnectDelay = 4000;
  const startupGraceMs = 10000;
  const metadataIntervalMs = 12000;
  const passiveMetadataIntervalMs = 15000;

  // =========================
  // STATE
  // =========================
  let isPlaying = false;
  let reconnectTimer = null;
  let reconnectAttempts = 0;
  let metadataTimer = null;
  let passiveMetadataTimer = null;
  let toastTimer = null;

  let currentCoverUrl = DEFAULT_COVER;
  let lastMetadataTitle = "";
  let lastTrackShown = "";
  let isUserPaused = false;
  let playbackStartedAt = 0;
  let isRecovering = false;

  // =========================
  // WEB AUDIO / REAL VU
  // =========================
  let audioContext = null;
  let analyser = null;
  let sourceNode = null;
  let vuDataArray = null;
  let vuAnimationId = null;
  let audioGraphReady = false;
  let canvasCtx = null;

  // =========================
  // AUDIO BASE
  // =========================
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

  function updateTrack(title, artist = DEFAULT_ARTIST_TEXT) {
    if (trackInfo) trackInfo.textContent = title || DEFAULT_TRACK_TEXT;
    if (trackArtist) trackArtist.textContent = artist || DEFAULT_ARTIST_TEXT;
  }

  function updatePlayUI(playing) {
    isPlaying = playing;

    if (playIcon) playIcon.textContent = playing ? "❚❚" : "▶";
    if (miniPlayIcon) miniPlayIcon.textContent = playing ? "❚❚" : "▶";

    if (player) player.classList.toggle("playing", playing);

    if (!playing && isUserPaused) {
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

  function withinStartupGrace() {
    return Date.now() - playbackStartedAt < startupGraceMs;
  }

  function setCover(url) {
    if (!stationCover) return;

    const finalUrl = url || DEFAULT_COVER;
    if (finalUrl === currentCoverUrl) return;

    stationCover.style.opacity = "0.4";
    stationCover.style.transform = "scale(0.985)";

    const img = new Image();
    img.onload = () => {
      stationCover.src = finalUrl;
      currentCoverUrl = finalUrl;
      requestAnimationFrame(() => {
        stationCover.style.opacity = "1";
        stationCover.style.transform = "scale(1)";
      });
    };
    img.onerror = () => {
      stationCover.src = DEFAULT_COVER;
      currentCoverUrl = DEFAULT_COVER;
      requestAnimationFrame(() => {
        stationCover.style.opacity = "1";
        stationCover.style.transform = "scale(1)";
      });
    };
    img.src = finalUrl;
  }

  function resetMetadataUI() {
    updateTrack(DEFAULT_TRACK_TEXT, DEFAULT_ARTIST_TEXT);
    setCover(DEFAULT_COVER);
  }

  function showSongToast(songText) {
    if (!songToast || !toastSong || !songText) return;

    toastSong.textContent = songText;
    songToast.classList.remove("hidden");

    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      songToast.classList.add("hidden");
    }, 3500);
  }

  // =========================
  // NORMALIZAR TEXTO / ACENTOS
  // =========================
  function safeDecodeText(str = "") {
    if (!str || typeof str !== "string") return "";

    let output = str.trim();

    try {
      output = decodeURIComponent(output);
    } catch (_) {}

    const fixes = {
      "Ã¡": "á", "Ã©": "é", "Ã­": "í", "Ã³": "ó", "Ãº": "ú",
      "Ã": "Á", "Ã‰": "É", "Ã": "Í", "Ã“": "Ó", "Ãš": "Ú",
      "Ã±": "ñ", "Ã‘": "Ñ", "Ã¼": "ü", "Ãœ": "Ü",
      "â€™": "’", "â€œ": "“", "â€": "”", "â€“": "–", "â€”": "—",
      "â€¦": "…", "Â": "", "Ã": "í"
    };

    Object.entries(fixes).forEach(([bad, good]) => {
      output = output.split(bad).join(good);
    });

    return output
      .replace(/\s+/g, " ")
      .replace(/[^\S\r\n]+/g, " ")
      .trim();
  }

  function normalizeForSearch(str = "") {
    return safeDecodeText(str)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w\s\-&]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  // =========================
  // PARSE TITLE
  // =========================
  function parseTitle(rawTitle = "") {
    const decoded = safeDecodeText(rawTitle);

    if (!decoded || typeof decoded !== "string") {
      return {
        artist: "",
        title: DEFAULT_TRACK_TEXT
      };
    }

    const cleaned = decoded
      .replace(/^NOW:\s*/i, "")
      .trim();

    if (
      cleaned === "-" ||
      cleaned === "- ," ||
      cleaned === ", -" ||
      cleaned === " - "
    ) {
      return {
        artist: "",
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
      const artist = safeDecodeText(parts.shift().trim());
      const title = safeDecodeText(parts.join(" - ").trim());

      return {
        artist: artist || "",
        title: title || cleaned
      };
    }

    return {
      artist: "",
      title: cleaned
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
      const cleanArtist = normalizeForSearch(artist);
      const cleanTitle = normalizeForSearch(title);
      const query = encodeURIComponent(`${cleanArtist} ${cleanTitle}`.trim());
      const url = `https://itunes.apple.com/search?term=${query}&entity=song&limit=5`;

      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) {
        setCover(DEFAULT_COVER);
        return;
      }

      const data = await response.json();
      const results = data?.results || [];

      const best = results.find(item => item?.artworkUrl100) || null;

      if (best?.artworkUrl100) {
        const hiResCover = best.artworkUrl100.replace("100x100bb", "600x600bb");
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
          return (
            listen.includes(MOUNTPOINT.toLowerCase()) ||
            name.includes("sonarrock")
          );
        }) || null
      );
    }

    return sources;
  }

  async function fetchNowPlayingFallback() {
    try {
      const response = await fetch(`${GISS_NOWPLAYING_URL}&t=${Date.now()}`, {
        cache: "no-store"
      });

      if (!response.ok) return "";

      const text = await response.text();
      return safeDecodeText(text || "");
    } catch (error) {
      console.warn("Fallback now playing no disponible:", error);
      return "";
    }
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
        setStatus("Fuera de línea", false);
        resetMetadataUI();
        return;
      }

      const isReallyLive = !!source.stream_start_iso8601;

      if (!isReallyLive) {
        setStatus("Fuera de línea", false);
        resetMetadataUI();
        return;
      }

      setStatus("Transmitiendo en vivo", true);

      let rawTitle =
        source.title ||
        source.artist ||
        source.server_description ||
        "";

      rawTitle = safeDecodeText(rawTitle);

      if (!rawTitle || rawTitle.trim() === "-" || rawTitle.trim() === "- ,") {
        const fallbackTitle = await fetchNowPlayingFallback();
        if (fallbackTitle) rawTitle = fallbackTitle;
      }

      if (!rawTitle) {
        rawTitle = DEFAULT_TRACK_TEXT;
      }

      if (rawTitle !== lastMetadataTitle) {
        lastMetadataTitle = rawTitle;

        const parsed = parseTitle(rawTitle);
        const finalArtist = parsed.artist || "SONAR ROCK";
        const finalTitle = parsed.title || DEFAULT_TRACK_TEXT;

        updateTrack(finalTitle, finalArtist);
        fetchAlbumArt(parsed.artist, parsed.title);

        const currentTrackKey = `${finalArtist} - ${finalTitle}`;
        if (currentTrackKey !== lastTrackShown && finalTitle !== DEFAULT_TRACK_TEXT) {
          lastTrackShown = currentTrackKey;
          showSongToast(currentTrackKey);
        }
      }
    } catch (error) {
      console.warn("Metadata no disponible:", error);
    }
  }

  function startMetadataPolling() {
    stopMetadataPolling();
    fetchMetadata();
    metadataTimer = setInterval(fetchMetadata, metadataIntervalMs);
  }

  function stopMetadataPolling() {
    if (metadataTimer) {
      clearInterval(metadataTimer);
      metadataTimer = null;
    }
  }

  function startPassiveMetadataPolling() {
    stopPassiveMetadataPolling();
    fetchMetadata();
    passiveMetadataTimer = setInterval(fetchMetadata, passiveMetadataIntervalMs);
  }

  function stopPassiveMetadataPolling() {
    if (passiveMetadataTimer) {
      clearInterval(passiveMetadataTimer);
      passiveMetadataTimer = null;
    }
  }

  // =========================
  // REAL VU SETUP
  // =========================
  async function initAudioGraph() {
    if (audioGraphReady) return true;

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return false;

      audioContext = new AudioCtx();

      if (audioContext.state === "suspended") {
        await audioContext.resume();
      }

      analyser = audioContext.createAnalyser();
      analyser.fftSize = 128;
      analyser.smoothingTimeConstant = 0.82;

      sourceNode = audioContext.createMediaElementSource(audio);
      sourceNode.connect(analyser);
      analyser.connect(audioContext.destination);

      vuDataArray = new Uint8Array(analyser.frequencyBinCount);

      if (vuCanvas) {
        canvasCtx = vuCanvas.getContext("2d");
      }

      audioGraphReady = true;
      startVu();
      return true;
    } catch (error) {
      console.warn("VU real no disponible en este navegador:", error);
      audioGraphReady = false;
      return false;
    }
  }

  async function resumeAudioGraph() {
    if (!audioContext) return;
    try {
      if (audioContext.state === "suspended") {
        await audioContext.resume();
      }
    } catch (error) {
      console.warn("No se pudo reanudar AudioContext:", error);
    }
  }

  function drawVuIdle() {
    if (!vuCanvas || !canvasCtx) return;

    const w = vuCanvas.width;
    const h = vuCanvas.height;

    canvasCtx.clearRect(0, 0, w, h);

    const bars = 26;
    const gap = 4;
    const barWidth = (w - gap * (bars - 1)) / bars;
    const centerY = h / 2;

    for (let i = 0; i < bars; i++) {
      const x = i * (barWidth + gap);
      const baseHeight = 8 + Math.sin((Date.now() / 500) + i * 0.35) * 2.2;

      const grad = canvasCtx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, "rgba(53,215,255,0.18)");
      grad.addColorStop(0.5, "rgba(255,122,26,0.14)");
      grad.addColorStop(1, "rgba(255,255,255,0.08)");

      canvasCtx.fillStyle = grad;
      canvasCtx.fillRect(x, centerY - baseHeight / 2, barWidth, baseHeight);
    }
  }

  function drawVuActive() {
    if (!analyser || !vuDataArray || !vuCanvas || !canvasCtx) return;

    analyser.getByteFrequencyData(vuDataArray);

    const w = vuCanvas.width;
    const h = vuCanvas.height;
    canvasCtx.clearRect(0, 0, w, h);

    const bars = 26;
    const gap = 4;
    const barWidth = (w - gap * (bars - 1)) / bars;
    const centerY = h / 2;
    const step = Math.floor(vuDataArray.length / bars) || 1;

    for (let i = 0; i < bars; i++) {
      const value = vuDataArray[i * step] || 0;
      const scaled = Math.max(8, (value / 255) * (h - 8));
      const x = i * (barWidth + gap);

      const grad = canvasCtx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, "rgba(53,215,255,0.95)");
      grad.addColorStop(0.55, "rgba(111,170,255,0.92)");
      grad.addColorStop(1, "rgba(255,122,26,0.88)");

      canvasCtx.fillStyle = grad;
      canvasCtx.shadowBlur = 10;
      canvasCtx.shadowColor = "rgba(53,215,255,0.22)";
      canvasCtx.fillRect(x, centerY - scaled / 2, barWidth, scaled);
    }

    canvasCtx.shadowBlur = 0;
  }

  function renderVu() {
    if (!vuCanvas || !canvasCtx) return;

    if (audioGraphReady && isPlaying && !audio.paused) {
      drawVuActive();
    } else {
      drawVuIdle();
    }

    vuAnimationId = requestAnimationFrame(renderVu);
  }

  function startVu() {
    if (vuAnimationId) cancelAnimationFrame(vuAnimationId);
    renderVu();
  }

  function resizeVuCanvas() {
    if (!vuCanvas) return;

    const rect = vuCanvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    vuCanvas.width = Math.max(260, Math.floor(rect.width * dpr));
    vuCanvas.height = Math.floor(60 * dpr);

    if (canvasCtx) {
      canvasCtx.setTransform(1, 0, 0, 1, 0, 0);
      canvasCtx.scale(dpr, dpr);
    }
  }

  // =========================
  // RECONEXIÓN INTELIGENTE
  // =========================
  async function recoverPlayback(forceReload = false) {
    if (!isPlaying || isUserPaused || isRecovering) return;

    if (reconnectAttempts >= maxReconnectAttempts) {
      setStatus("No se pudo reconectar", false);
      updatePlayUI(false);
      return;
    }

    isRecovering = true;
    reconnectAttempts++;
    clearReconnect();

    setStatus(`Reconectando señal... (${reconnectAttempts})`, false);

    reconnectTimer = setTimeout(async () => {
      try {
        if (forceReload) {
          audio.pause();
          audio.src = `${STREAM_URL}?t=${Date.now()}`;
          audio.load();
        }

        await resumeAudioGraph();
        await audio.play();
        isRecovering = false;
      } catch (error) {
        console.error("Reconexión fallida:", error);
        isRecovering = false;
        recoverPlayback(true);
      }
    }, reconnectDelay);
  }

  // =========================
  // PLAY / PAUSE
  // =========================
  async function playStream() {
    try {
      clearReconnect();
      reconnectAttempts = 0;
      isUserPaused = false;
      isRecovering = false;
      playbackStartedAt = Date.now();

      setStatus("Conectando con la señal...", false);

      await initAudioGraph();
      await resumeAudioGraph();

      if (!audio.src || !audio.src.includes(STREAM_URL)) {
        audio.src = STREAM_URL;
      }

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
    isUserPaused = true;
    isRecovering = false;
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
  // BOTONES
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
  audio.addEventListener("playing", async () => {
    clearReconnect();
    reconnectAttempts = 0;
    isRecovering = false;

    await resumeAudioGraph();

    updatePlayUI(true);
    setStatus("Transmitiendo en vivo", true);
    startMetadataPolling();
  });

  audio.addEventListener("pause", () => {
    if (isUserPaused) {
      updatePlayUI(false);
    }
  });

  audio.addEventListener("waiting", () => {
    if (!isPlaying || isUserPaused) return;

    setStatus("Bufferizando señal...", false);

    if (!withinStartupGrace()) {
      recoverPlayback(false);
    }
  });

  audio.addEventListener("stalled", () => {
    if (!isPlaying || isUserPaused) return;

    if (withinStartupGrace()) {
      setStatus("Estabilizando señal...", false);
      return;
    }

    setStatus("Señal detenida, recuperando...", false);
    recoverPlayback(false);
  });

  audio.addEventListener("suspend", () => {
    if (!isPlaying || isUserPaused) return;
    setStatus("Transmitiendo en vivo", true);
  });

  audio.addEventListener("error", () => {
    console.error("Error en stream");

    if (!isPlaying || isUserPaused) {
      updatePlayUI(false);
      setStatus("Error al conectar con la señal", false);
      return;
    }

    setStatus("Error en la señal, recuperando...", false);
    recoverPlayback(true);
  });

  audio.addEventListener("loadstart", () => {
    if (isPlaying && !withinStartupGrace()) {
      setStatus("Cargando stream...", false);
    }
  });

  audio.addEventListener("canplay", () => {
    if (isPlaying) {
      setStatus("Señal lista", true);
    }
  });

  audio.addEventListener("volumechange", updateMuteUI);

  // =========================
  // VISIBILIDAD / iPHONE
  // =========================
  document.addEventListener("visibilitychange", async () => {
    if (!document.hidden) {
      await resumeAudioGraph();

      if (isPlaying && audio.paused && !isUserPaused) {
        recoverPlayback(false);
      }
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

  // =========================
  // RESIZE
  // =========================
  function handleResize() {
    handleMiniPlayer();
    resizeVuCanvas();
  }

  window.addEventListener("resize", handleResize);

  // =========================
  // INIT
  // =========================
  updateMuteUI();
  updatePlayUI(false);
  resetMetadataUI();
  songToast?.classList.add("hidden");

  if (vuCanvas) {
    canvasCtx = vuCanvas.getContext("2d");
    resizeVuCanvas();
    startVu();
  }

  handleMiniPlayer();
  startPassiveMetadataPolling();
});
