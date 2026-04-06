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

  // VISUALIZER
  let audioCtx = null;
  let analyser = null;
  let sourceNode = null;
  let dataArray = null;
  let animationFrame = null;
  let visualizerMode = "fallback"; // real | fallback
  let fakeBars = [];
  let visualizerInitialized = false;

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

    stationCover.style.opacity = "0.45";

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
  // FIX ENCODING / TEXTO SUCIO
  // =========================
  function tryDecodeLatin1ToUtf8(str = "") {
    try {
      return decodeURIComponent(escape(str));
    } catch {
      return str;
    }
  }

  function looksMisencoded(str = "") {
    return /Ã.|Â.|â.|ð|�/.test(str);
  }

  function normalizeWeirdChars(str = "") {
    return str
      .replace(/[“”„‟]/g, '"')
      .replace(/[‘’‚‛]/g, "'")
      .replace(/[‐-‒–—―]/g, "-")
      .replace(/\u00A0/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function cleanMetadataText(str = "") {
    if (!str || typeof str !== "string") return "";

    let fixed = str.trim();

    // Si parece venir mal codificado, intenta repararlo
    if (looksMisencoded(fixed)) {
      fixed = tryDecodeLatin1ToUtf8(fixed);
    }

    // Segunda pasada por si sigue roto
    if (looksMisencoded(fixed)) {
      fixed = tryDecodeLatin1ToUtf8(fixed);
    }

    fixed = normalizeWeirdChars(fixed);

    // Limpieza de basura común
    fixed = fixed
      .replace(/\s*\|\s*SONAR ROCK\s*$/i, "")
      .replace(/\s*\|\s*LIVE\s*$/i, "")
      .replace(/\s*\|\s*RADIO\s*$/i, "")
      .replace(/^\-+\s*/, "")
      .replace(/\s*\-+\s*$/, "")
      .replace(/\s{2,}/g, " ")
      .trim();

    return fixed;
  }

  function normalizeSearchText(str = "") {
    return cleanMetadataText(str)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // quita acentos solo para búsquedas
      .replace(/[^\w\s\-&']/g, " ")
      .replace(/\s+/g, " ")
      .trim();
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

    if (cleaned === "-" || cleaned === "- ," || cleaned === ", -" || cleaned === " - ") {
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
      const artist = parts.shift().trim();
      const title = parts.join(" - ").trim();

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
    const cleanArtist = normalizeSearchText(artist || "");
    const cleanTitle = normalizeSearchText(title || "");

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
      const results = Array.isArray(data?.results) ? data.results : [];

      if (!results.length) {
        setCover(DEFAULT_COVER);
        return;
      }

      // Preferir coincidencia más lógica
      const bestMatch =
        results.find(item => {
          const a = normalizeSearchText(item.artistName || "");
          const t = normalizeSearchText(item.trackName || "");
          return (
            (cleanArtist && a.includes(cleanArtist)) ||
            (cleanTitle && t.includes(cleanTitle))
          );
        }) || results[0];

      if (bestMatch?.artworkUrl100) {
        const hiResCover = bestMatch.artworkUrl100.replace("100x100bb", "600x600bb");
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
return cleanMetadataText((text || "").trim());
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

      let rawTitle = cleanMetadataText(
  source.title ||
  source.artist ||
  source.server_description ||
  ""
);

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
        const finalArtist = cleanMetadataText(parsed.artist || "SONAR ROCK");
        const finalTitle = cleanMetadataText(parsed.title || DEFAULT_TRACK_TEXT);

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
  // VISUALIZER REAL / FALLBACK
  // =========================
  function resizeCanvas() {
    if (!vuCanvas) return;
    const rect = vuCanvas.getBoundingClientRect();
    vuCanvas.width = Math.max(320, Math.floor(rect.width * window.devicePixelRatio));
    vuCanvas.height = Math.max(78, Math.floor(rect.height * window.devicePixelRatio));
  }

  function initFakeBars() {
    if (!vuCanvas) return;
    const bars = 42;
    fakeBars = Array.from({ length: bars }, (_, i) => ({
      value: 0.15 + Math.random() * 0.25,
      speed: 0.01 + Math.random() * 0.025,
      offset: Math.random() * Math.PI * 2,
      index: i
    }));
  }

  async function initVisualizer() {
    if (visualizerInitialized || !vuCanvas || !vuCtx) return;
    visualizerInitialized = true;

    resizeCanvas();
    initFakeBars();

    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) throw new Error("Web Audio API no soportada");

      audioCtx = new AudioContextClass();
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.82;

      sourceNode = audioCtx.createMediaElementSource(audio);
      sourceNode.connect(analyser);
      analyser.connect(audioCtx.destination);

      dataArray = new Uint8Array(analyser.frequencyBinCount);
      visualizerMode = "real";
    } catch (error) {
      console.warn("Visualizer real no disponible, usando fallback:", error);
      visualizerMode = "fallback";
    }

    drawVisualizer();
  }

  function drawRoundedBar(ctx, x, y, w, h, r) {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
    ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();
  }

  function drawVisualizer() {
    if (!vuCanvas || !vuCtx) return;

    const ctx = vuCtx;
    const w = vuCanvas.width;
    const h = vuCanvas.height;
    const dpr = window.devicePixelRatio || 1;

    ctx.clearRect(0, 0, w, h);

    // fondo glow
    const bgGlow = ctx.createLinearGradient(0, 0, w, 0);
    bgGlow.addColorStop(0, "rgba(255,122,26,0.04)");
    bgGlow.addColorStop(0.5, "rgba(0,180,255,0.045)");
    bgGlow.addColorStop(1, "rgba(255,122,26,0.04)");
    ctx.fillStyle = bgGlow;
    ctx.fillRect(0, 0, w, h);

    const bars = 42;
    const gap = 8 * dpr;
    const barWidth = (w - gap * (bars - 1)) / bars;
    const centerY = h / 2;
    const maxHeight = h * 0.72;

    let values = new Array(bars).fill(0.08);

    if (visualizerMode === "real" && analyser && dataArray) {
      analyser.getByteFrequencyData(dataArray);

      for (let i = 0; i < bars; i++) {
        const dataIndex = Math.floor((i / bars) * dataArray.length);
        const raw = dataArray[dataIndex] / 255;
        const boosted = Math.pow(raw, 1.18) * 1.35;
        values[i] = Math.min(1, boosted);
      }
    } else {
      const t = Date.now() * 0.0022;
      fakeBars.forEach((bar, i) => {
        const activeBoost = isPlaying ? 1 : 0.35;
        const volumeBoost = Math.max(0.25, audio.volume || 0.25);
        const pulse = (Math.sin(t * (1.4 + bar.speed * 8) + bar.offset) + 1) / 2;
        const drift = (Math.sin(t * 0.55 + i * 0.4) + 1) / 2;
        values[i] = (0.08 + pulse * 0.34 + drift * 0.16) * activeBoost * volumeBoost;
      });
    }

    // línea base
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(w, centerY);
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.lineWidth = 1 * dpr;
    ctx.stroke();

    for (let i = 0; i < bars; i++) {
      const x = i * (barWidth + gap);
      const val = values[i];
      const barH = Math.max(8 * dpr, val * maxHeight);

      const y = centerY - barH / 2;

      const grad = ctx.createLinearGradient(0, y, 0, y + barH);
      grad.addColorStop(0, "rgba(255,255,255,0.98)");
      grad.addColorStop(0.22, "rgba(110,210,255,0.95)");
      grad.addColorStop(0.58, "rgba(255,122,26,0.95)");
      grad.addColorStop(1, "rgba(255,90,0,0.92)");

      ctx.shadowBlur = 14 * dpr;
      ctx.shadowColor = "rgba(255,122,26,0.18)";
      ctx.fillStyle = grad;

      drawRoundedBar(ctx, x, y, barWidth, barH, 12 * dpr);

      // glow superior sutil
      ctx.shadowBlur = 0;
      ctx.fillStyle = "rgba(255,255,255,0.12)";
      drawRoundedBar(ctx, x, y, barWidth, Math.max(4 * dpr, barH * 0.12), 10 * dpr);
    }

    animationFrame = requestAnimationFrame(drawVisualizer);
  }

  function stopVisualizer() {
    if (animationFrame) {
      cancelAnimationFrame(animationFrame);
      animationFrame = null;
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

      if (!audio.src || !audio.src.includes(STREAM_URL)) {
        audio.src = STREAM_URL;
      }

      await initVisualizer();

      if (audioCtx && audioCtx.state === "suspended") {
        await audioCtx.resume();
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
  audio.addEventListener("playing", () => {
    clearReconnect();
    reconnectAttempts = 0;
    isRecovering = false;
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

  window.addEventListener("resize", () => {
    handleMiniPlayer();
    resizeCanvas();
  });

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
  startPassiveMetadataPolling();

  resizeCanvas();
  initFakeBars();
  drawVisualizer();

  window.addEventListener("beforeunload", () => {
    stopVisualizer();
    stopMetadataPolling();
    stopPassiveMetadataPolling();
  });
});
