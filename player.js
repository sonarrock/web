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
  const vuCanvas = document.getElementById("vuMeter");

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
  let deferredPrompt = null;
  let toastTimer = null;

  let currentCoverUrl = DEFAULT_COVER;
  let lastMetadataTitle = "";
  let lastTrackShown = "";
  let isUserPaused = false;
  let playbackStartedAt = 0;
  let isRecovering = false;

  // =========================
  // VU METER REAL (Web Audio)
  // =========================
  let audioCtx = null;
  let analyser = null;
  let sourceNode = null;
  let dataArray = null;
  let animationFrame = null;
  let audioGraphReady = false;

  const canvasCtx = vuCanvas ? vuCanvas.getContext("2d") : null;

  function resizeCanvasForDPR() {
    if (!vuCanvas || !canvasCtx) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = vuCanvas.getBoundingClientRect();

    vuCanvas.width = Math.floor(rect.width * dpr);
    vuCanvas.height = Math.floor(rect.height * dpr);

    canvasCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function initAudioGraph() {
    if (audioGraphReady || !audio) return;

    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.82;

      sourceNode = audioCtx.createMediaElementSource(audio);
      sourceNode.connect(analyser);
      analyser.connect(audioCtx.destination);

      dataArray = new Uint8Array(analyser.frequencyBinCount);
      audioGraphReady = true;

      resizeCanvasForDPR();
      drawVUMeter();
    } catch (err) {
      console.warn("No se pudo inicializar Web Audio API:", err);
    }
  }

  async function resumeAudioGraph() {
    if (!audioCtx) return;
    if (audioCtx.state === "suspended") {
      try {
        await audioCtx.resume();
      } catch (err) {
        console.warn("No se pudo reanudar AudioContext:", err);
      }
    }
  }

  function stopVUMeter() {
    if (animationFrame) {
      cancelAnimationFrame(animationFrame);
      animationFrame = null;
    }
    drawIdleMeter();
  }

  function drawIdleMeter() {
    if (!vuCanvas || !canvasCtx) return;

    const width = vuCanvas.clientWidth;
    const height = vuCanvas.clientHeight;

    canvasCtx.clearRect(0, 0, width, height);

    const bars = 28;
    const gap = 4;
    const barWidth = (width - gap * (bars - 1)) / bars;
    const baseY = height;

    for (let i = 0; i < bars; i++) {
      const h = 10 + Math.sin(i * 0.55) * 2;
      const x = i * (barWidth + gap);
      const y = baseY - h;

      const grad = canvasCtx.createLinearGradient(0, y, 0, baseY);
      grad.addColorStop(0, "rgba(255,255,255,0.22)");
      grad.addColorStop(0.55, "rgba(255,209,102,0.14)");
      grad.addColorStop(1, "rgba(255,122,26,0.08)");

      canvasCtx.fillStyle = grad;
      roundRect(canvasCtx, x, y, barWidth, h, 4);
      canvasCtx.fill();
    }
  }

  function drawVUMeter() {
    if (!analyser || !vuCanvas || !canvasCtx || !dataArray) return;

    const width = vuCanvas.clientWidth;
    const height = vuCanvas.clientHeight;

    analyser.getByteFrequencyData(dataArray);

    canvasCtx.clearRect(0, 0, width, height);

    const bars = 28;
    const gap = 4;
    const barWidth = (width - gap * (bars - 1)) / bars;
    const step = Math.floor(dataArray.length / bars);
    const baseY = height;

    for (let i = 0; i < bars; i++) {
      const sample = dataArray[i * step] || 0;
      const normalized = sample / 255;

      const minHeight = 6;
      const maxHeight = height - 6;
      const barHeight = Math.max(minHeight, normalized * maxHeight);

      const x = i * (barWidth + gap);
      const y = baseY - barHeight;

      const grad = canvasCtx.createLinearGradient(0, y, 0, baseY);
      grad.addColorStop(0, "#ffffff");
      grad.addColorStop(0.18, "#f5f5f5");
      grad.addColorStop(0.42, "#ffd166");
      grad.addColorStop(0.68, "#ff9f43");
      grad.addColorStop(1, "#ff7a1a");

      canvasCtx.fillStyle = grad;
      roundRect(canvasCtx, x, y, barWidth, barHeight, 4);
      canvasCtx.fill();
    }

    animationFrame = requestAnimationFrame(drawVUMeter);
  }

  function roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  window.addEventListener("resize", () => {
    resizeCanvasForDPR();
    if (!isPlaying) drawIdleMeter();
  });

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
      stopVUMeter();
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

    stationCover.style.opacity = "0.35";
    stationCover.style.filter = "blur(2px) saturate(0.95)";

    const img = new Image();
    img.onload = () => {
      stationCover.src = finalUrl;
      currentCoverUrl = finalUrl;

      requestAnimationFrame(() => {
        stationCover.style.opacity = "1";
        stationCover.style.filter = "blur(0px) saturate(1.02)";
      });
    };

    img.onerror = () => {
      stationCover.src = DEFAULT_COVER;
      currentCoverUrl = DEFAULT_COVER;

      requestAnimationFrame(() => {
        stationCover.style.opacity = "1";
        stationCover.style.filter = "blur(0px) saturate(1.02)";
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
  // TEXTO / ACENTOS / NORMALIZACIÓN
  // =========================
  function decodeHtmlEntities(str = "") {
    const txt = document.createElement("textarea");
    txt.innerHTML = str;
    return txt.value;
  }

  function sanitizeText(str = "") {
    if (!str || typeof str !== "string") return "";

    return decodeHtmlEntities(str)
      .normalize("NFC")
      .replace(/\uFFFD/g, "") // caracter roto �
      .replace(/&amp;/gi, "&")
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'")
      .replace(/\s+/g, " ")
      .trim();
  }

  // =========================
  // PARSE TITLE
  // =========================
  function parseTitle(rawTitle = "") {
    const cleanedRaw = sanitizeText(rawTitle);

    if (!cleanedRaw) {
      return {
        artist: "",
        title: DEFAULT_TRACK_TEXT
      };
    }

    const cleaned = cleanedRaw
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
      const artist = sanitizeText(parts.shift().trim());
      const title = sanitizeText(parts.join(" - ").trim());

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
    const cleanArtist = sanitizeText(artist);
    const cleanTitle = sanitizeText(title);

    if (!cleanArtist && !cleanTitle) {
      setCover(DEFAULT_COVER);
      return;
    }

    try {
      const query = encodeURIComponent(`${cleanArtist} ${cleanTitle}`.trim());
      const url = `https://itunes.apple.com/search?term=${query}&entity=song&limit=5`;

      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) {
        setCover(DEFAULT_COVER);
        return;
      }

      const data = await response.json();
      const results = data?.results || [];

      let best = results.find(item => {
        const a = sanitizeText(item.artistName || "").toLowerCase();
        const t = sanitizeText(item.trackName || "").toLowerCase();

        return (
          a.includes(cleanArtist.toLowerCase()) ||
          t.includes(cleanTitle.toLowerCase())
        );
      });

      if (!best) best = results[0];

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
      return sanitizeText(text || "");
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

      rawTitle = sanitizeText(rawTitle);

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
  // RECONEXIÓN INTELIGENTE
  // =========================
  async function recoverPlayback(forceReload = false) {
    if (!isPlaying || isUserPaused || isRecovering) return;

    if (reconnectAttempts >= maxReconnectAttempts) {
      setStatus("No se pudo reconectar la señal", false);
      updatePlayUI(false);
      stopVUMeter();
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

      initAudioGraph();
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
      stopVUMeter();
    }
  }

  function pauseStream() {
    clearReconnect();
    stopMetadataPolling();
    isUserPaused = true;
    isRecovering = false;
    audio.pause();
    updatePlayUI(false);
    stopVUMeter();
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

    initAudioGraph();
    await resumeAudioGraph();

    updatePlayUI(true);
    setStatus("Transmitiendo en vivo", true);
    startMetadataPolling();

    if (!animationFrame) drawVUMeter();
  });

  audio.addEventListener("pause", () => {
    if (isUserPaused) {
      updatePlayUI(false);
      stopVUMeter();
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
      stopVUMeter();
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

  audio.addEventListener("ended", () => {
    stopVUMeter();
    updatePlayUI(false);
    setStatus("Fuera de línea", false);
  });

  audio.addEventListener("volumechange", updateMuteUI);

  // =========================
  // VISIBILIDAD / iPHONE
  // =========================
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && isPlaying && audio.paused && !isUserPaused) {
      recoverPlayback(false);
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
  // PWA INSTALL
  // =========================
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;

    if (installBar) installBar.classList.add("show");
    if (installBtn) installBtn.style.display = "inline-flex";
  });

  installBtn?.addEventListener("click", async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;

    if (choice.outcome === "accepted") {
      if (installBar) installBar.classList.remove("show");
    }

    deferredPrompt = null;
  });

  window.addEventListener("appinstalled", () => {
    if (installBar) installBar.classList.remove("show");
    deferredPrompt = null;
  });

  // =========================
  // INIT
  // =========================
  updateMuteUI();
  updatePlayUI(false);
  resetMetadataUI();
  songToast?.classList.add("hidden");

  resizeCanvasForDPR();
  drawIdleMeter();

  startPassiveMetadataPolling();
});
