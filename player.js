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
  const vuCanvas = document.getElementById("vuMeter");
  const vuCtx = vuCanvas ? vuCanvas.getContext("2d") : null;

  if (!audio || !playBtn) return;

  // =========================
  // CONFIG
  // =========================
  const STREAM_URL = "https://giss.tv:667/sonarrock.mp3";
  const METADATA_URL = "https://giss.tv:667/status-json.xsl";
  const GISS_NOWPLAYING_URL = "https://giss.tv/player/playing.php?mp=sonarrock.mp3";
  const MOUNTPOINT = "sonarrock.mp3";

  const DEFAULT_TRACK_TEXT = "Transmitiendo rock sin concesiones";
  const DEFAULT_ARTIST_TEXT = "SONAR ROCK";
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
  // AUDIO / WEB AUDIO
  // =========================
  audio.src = STREAM_URL;
  audio.preload = "none";
  audio.setAttribute("playsinline", "");
  audio.setAttribute("webkit-playsinline", "");
  audio.crossOrigin = "anonymous";

  let audioContext = null;
  let analyser = null;
  let sourceNode = null;
  let dataArray = null;
  let animationFrame = null;

  function setupAudioAnalyzer() {
    if (!vuCanvas || !vuCtx || audioContext) return;

    try {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.85;

      sourceNode = audioContext.createMediaElementSource(audio);
      sourceNode.connect(analyser);
      analyser.connect(audioContext.destination);

      dataArray = new Uint8Array(analyser.frequencyBinCount);

      resizeVuCanvas();
      drawVUMeter();
    } catch (err) {
      console.warn("No se pudo iniciar Web Audio API:", err);
    }
  }

  function resizeVuCanvas() {
    if (!vuCanvas) return;
    const rect = vuCanvas.getBoundingClientRect();
    vuCanvas.width = rect.width * window.devicePixelRatio;
    vuCanvas.height = rect.height * window.devicePixelRatio;
    vuCtx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
  }

  function drawVUMeter() {
    if (!vuCanvas || !vuCtx) return;

    const width = vuCanvas.clientWidth;
    const height = vuCanvas.clientHeight;

    vuCtx.clearRect(0, 0, width, height);

    // fondo
    const bg = vuCtx.createLinearGradient(0, 0, width, 0);
    bg.addColorStop(0, "rgba(255,255,255,0.03)");
    bg.addColorStop(1, "rgba(255,255,255,0.01)");
    vuCtx.fillStyle = bg;
    roundRect(vuCtx, 0, 0, width, height, 12, true, false);

    if (!analyser || !dataArray || !isPlaying) {
      drawIdleBars(width, height);
      animationFrame = requestAnimationFrame(drawVUMeter);
      return;
    }

    analyser.getByteFrequencyData(dataArray);

    const bars = 28;
    const gap = 4;
    const barWidth = (width - gap * (bars - 1)) / bars;

    for (let i = 0; i < bars; i++) {
      const index = Math.floor((i / bars) * dataArray.length);
      const value = dataArray[index] / 255;

      const barHeight = Math.max(4, value * (height - 8));
      const x = i * (barWidth + gap);
      const y = height - barHeight;

      const grad = vuCtx.createLinearGradient(0, y, 0, height);
      grad.addColorStop(0, "rgba(255,255,255,0.95)");
      grad.addColorStop(0.45, "rgba(80,180,255,0.95)");
      grad.addColorStop(1, "rgba(255,122,26,0.95)");

      vuCtx.fillStyle = grad;
      roundRect(vuCtx, x, y, barWidth, barHeight, 4, true, false);
    }

    animationFrame = requestAnimationFrame(drawVUMeter);
  }

  function drawIdleBars(width, height) {
    const bars = 28;
    const gap = 4;
    const barWidth = (width - gap * (bars - 1)) / bars;
    const t = Date.now() * 0.004;

    for (let i = 0; i < bars; i++) {
      const wave = Math.sin(t + i * 0.35);
      const barHeight = 5 + Math.max(0, wave * 8);
      const x = i * (barWidth + gap);
      const y = height - barHeight;

      const grad = vuCtx.createLinearGradient(0, y, 0, height);
      grad.addColorStop(0, "rgba(255,255,255,0.18)");
      grad.addColorStop(1, "rgba(255,122,26,0.14)");

      vuCtx.fillStyle = grad;
      roundRect(vuCtx, x, y, barWidth, barHeight, 4, true, false);
    }
  }

  function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
    if (typeof radius === "number") {
      radius = { tl: radius, tr: radius, br: radius, bl: radius };
    }

    ctx.beginPath();
    ctx.moveTo(x + radius.tl, y);
    ctx.lineTo(x + width - radius.tr, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
    ctx.lineTo(x + width, y + height - radius.br);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
    ctx.lineTo(x + radius.bl, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
    ctx.lineTo(x, y + radius.tl);
    ctx.quadraticCurveTo(x, y, x + radius.tl, y);
    ctx.closePath();

    if (fill) ctx.fill();
    if (stroke) ctx.stroke();
  }

  window.addEventListener("resize", resizeVuCanvas);

  // =========================
  // STORAGE
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

    stationCover.style.opacity = "0.18";
    stationCover.style.transform = "scale(0.96)";

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
  // FIX DE TEXTO / ENCODING
  // =========================
  function normalizeText(str = "") {
    if (!str || typeof str !== "string") return "";

    let text = str.trim();
    text = text.replace(/\s+/g, " ");

    const replacements = {
      "Ã¡": "á",
      "Ã©": "é",
      "Ã­": "í",
      "Ã³": "ó",
      "Ãº": "ú",
      "Ã": "Á",
      "Ã‰": "É",
      "Ã": "Í",
      "Ã“": "Ó",
      "Ãš": "Ú",
      "Ã±": "ñ",
      "Ã‘": "Ñ",
      "Ã¼": "ü",
      "Ãœ": "Ü",
      "â€™": "’",
      "â€˜": "‘",
      "â€œ": "“",
      "â€�": "”",
      "â€“": "–",
      "â€”": "—",
      "â€¦": "…",
      "â€¢": "•",
      "Â": "",
      "�": ""
    };

    Object.keys(replacements).forEach((bad) => {
      text = text.split(bad).join(replacements[bad]);
    });

    text = text
      .replace(/[\u0000-\u001F]/g, "")
      .replace(/\s{2,}/g, " ")
      .trim();

    return text;
  }

  function tryFixBrokenEncoding(str = "") {
    if (!str || typeof str !== "string") return "";

    const looksBroken = /Ã|Â|â€™|â€œ|â€|�/.test(str);

    if (!looksBroken) {
      return normalizeText(str);
    }

    try {
      const fixed = decodeURIComponent(escape(str));
      return normalizeText(fixed);
    } catch (e) {
      return normalizeText(str);
    }
  }

  function sanitizeForSearch(str = "") {
    if (!str || typeof str !== "string") return "";

    return str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\(.*?\)/g, "")
      .replace(/\[.*?\]/g, "")
      .replace(/\b(remaster(ed)?|live|version|edit|mono|stereo)\b/gi, "")
      .replace(/[^\w\s\-&]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function parseTitle(rawTitle = "") {
    if (!rawTitle || typeof rawTitle !== "string") {
      return {
        artist: "",
        title: DEFAULT_TRACK_TEXT
      };
    }

    const repaired = tryFixBrokenEncoding(rawTitle);

    const cleaned = repaired
      .replace(/^NOW:\s*/i, "")
      .replace(/^playing:\s*/i, "")
      .replace(/^current track:\s*/i, "")
      .trim();

    if (
      cleaned === "-" ||
      cleaned === "- ," ||
      cleaned === ", -" ||
      cleaned === " - " ||
      cleaned === ""
    ) {
      return {
        artist: "",
        title: DEFAULT_TRACK_TEXT
      };
    }

    const separators = [" - ", " – ", " — ", " | ", " ~ "];
    let parts = null;

    for (const sep of separators) {
      if (cleaned.includes(sep)) {
        parts = cleaned.split(sep);
        break;
      }
    }

    if (parts && parts.length >= 2) {
      const artist = normalizeText(parts.shift().trim());
      const title = normalizeText(parts.join(" - ").trim());

      return {
        artist: artist || "",
        title: title || cleaned
      };
    }

    return {
      artist: "",
      title: normalizeText(cleaned)
    };
  }

  // =========================
  // PORTADA
  // =========================
  async function fetchAlbumArt(artist, title) {
    if (!artist && !title) {
      setCover(DEFAULT_COVER);
      return;
    }

    try {
      const cleanArtist = sanitizeForSearch(tryFixBrokenEncoding(artist || ""));
      const cleanTitle = sanitizeForSearch(tryFixBrokenEncoding(title || ""));

      const attempts = [
        `${cleanArtist} ${cleanTitle}`.trim(),
        `${cleanTitle} ${cleanArtist}`.trim(),
        cleanTitle.trim(),
        `${cleanArtist} album`.trim()
      ].filter(Boolean);

      let foundCover = null;

      for (const term of attempts) {
        const query = encodeURIComponent(term);
        const url = `https://itunes.apple.com/search?term=${query}&entity=song&limit=5`;

        const response = await fetch(url, { cache: "no-store" });
        if (!response.ok) continue;

        const data = await response.json();
        const result = data?.results?.find(item => item?.artworkUrl100);

        if (result?.artworkUrl100) {
          foundCover = result.artworkUrl100.replace("100x100bb", "600x600bb");
          break;
        }
      }

      if (foundCover) {
        setCover(foundCover);
      } else {
        setCover(DEFAULT_COVER);
      }

    } catch (error) {
      console.warn("No se pudo cargar portada:", error);
      setCover(DEFAULT_COVER);
    }
  }

  // =========================
  // METADATA
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
      return (text || "").trim();
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

      rawTitle = tryFixBrokenEncoding(rawTitle);

      if (!rawTitle || rawTitle.trim() === "-" || rawTitle.trim() === "- ,") {
        const fallbackTitle = await fetchNowPlayingFallback();
        if (fallbackTitle) rawTitle = tryFixBrokenEncoding(fallbackTitle);
      }

      if (!rawTitle) {
        rawTitle = DEFAULT_TRACK_TEXT;
      }

      const parsed = parseTitle(rawTitle);
      const finalArtist = tryFixBrokenEncoding(parsed.artist || "SONAR ROCK");
      const finalTitle = tryFixBrokenEncoding(parsed.title || DEFAULT_TRACK_TEXT);

      const currentTrackKey = `${finalArtist} - ${finalTitle}`;

      if (currentTrackKey !== lastMetadataTitle) {
        lastMetadataTitle = currentTrackKey;

        updateTrack(finalTitle, finalArtist);
        fetchAlbumArt(finalArtist, finalTitle);

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
  // RECONEXIÓN
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

    setStatus(`Reconectando... (${reconnectAttempts})`, false);

    reconnectTimer = setTimeout(async () => {
      try {
        if (forceReload) {
          audio.pause();
          audio.src = `${STREAM_URL}?t=${Date.now()}`;
          audio.load();
        }

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

      setupAudioAnalyzer();

      if (audioContext && audioContext.state === "suspended") {
        await audioContext.resume();
      }

      setStatus("Conectando con la señal...", false);

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
  audio.addEventListener("playing", async () => {
    clearReconnect();
    reconnectAttempts = 0;
    isRecovering = false;

    if (audioContext && audioContext.state === "suspended") {
      try {
        await audioContext.resume();
      } catch {}
    }

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
      setStatus("Error al conectar", false);
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
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && isPlaying && audio.paused && !isUserPaused) {
      recoverPlayback(false);
    }
  });

  // =========================
  // MINI PLAYER
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
  songToast?.classList.add("hidden");
  startPassiveMetadataPolling();
});