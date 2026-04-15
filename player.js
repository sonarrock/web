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
  let isRecovering = false;

  // =========================
  // WEB AUDIO / VU
  // =========================
  let audioContext = null;
  let analyser = null;
  let sourceNode = null;
  let vuDataArray = null;
  let vuAnimationId = null;
  let audioGraphReady = false;
  let canvasCtx = null;

  // =========================
  // AUDIO SETUP — sin src al inicio
  // El src se asigna sólo cuando el usuario da play
  // para evitar que el browser pre-bufferice y dispare eventos
  // =========================
  audio.preload = "none";
  audio.setAttribute("playsinline", "");
  audio.setAttribute("webkit-playsinline", "");

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
    if (volumeControl) volumeControl.value = audio.muted ? 0 : audio.volume;
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
    toastTimer = setTimeout(() => songToast.classList.add("hidden"), 3500);
  }

  // =========================
  // TEXTO / ACENTOS
  // =========================
  function safeDecodeText(str = "") {
    if (!str || typeof str !== "string") return "";
    let output = str.trim();
    try { output = decodeURIComponent(output); } catch (_) {}
    const fixes = {
      "Ã¡":"á","Ã©":"é","Ã­":"í","Ã³":"ó","Ãº":"ú",
      "Ã":"Á","Ã‰":"É","Ã":"Í","Ã"":"Ó","Ãš":"Ú",
      "Ã±":"ñ","Ã'":"Ñ","Ã¼":"ü","Ãœ":"Ü",
      "â€™":"'","â€œ":"\u201c","â€":"\u201d","â€"":"–","â€"":"—",
      "â€¦":"…","Â":"","Ã":"í"
    };
    Object.entries(fixes).forEach(([bad, good]) => { output = output.split(bad).join(good); });
    return output.replace(/\s+/g," ").trim();
  }

  function normalizeForSearch(str = "") {
    return safeDecodeText(str)
      .normalize("NFD").replace(/[\u0300-\u036f]/g,"")
      .replace(/[^\w\s\-&]/g," ").replace(/\s+/g," ").trim();
  }

  function parseTitle(rawTitle = "") {
    const decoded = safeDecodeText(rawTitle);
    if (!decoded) return { artist:"", title:DEFAULT_TRACK_TEXT };
    const cleaned = decoded.replace(/^NOW:\s*/i,"").trim();
    if (["-","- ,"," , -"," - "].includes(cleaned)) return { artist:"", title:DEFAULT_TRACK_TEXT };
    for (const sep of [" - "," – "," — "]) {
      if (cleaned.includes(sep)) {
        const parts = cleaned.split(sep);
        const artist = safeDecodeText(parts.shift().trim());
        const title = safeDecodeText(parts.join(" - ").trim());
        return { artist, title: title || cleaned };
      }
    }
    return { artist:"", title:cleaned };
  }

  // =========================
  // PORTADA
  // =========================
  async function fetchAlbumArt(artist, title) {
    if (!artist && !title) { setCover(DEFAULT_COVER); return; }
    try {
      const q = encodeURIComponent(`${normalizeForSearch(artist)} ${normalizeForSearch(title)}`.trim());
      const res = await fetch(`https://itunes.apple.com/search?term=${q}&entity=song&limit=5`,{ cache:"no-store" });
      if (!res.ok) { setCover(DEFAULT_COVER); return; }
      const data = await res.json();
      const best = (data?.results || []).find(i => i?.artworkUrl100);
      if (best?.artworkUrl100) {
        setCover(best.artworkUrl100.replace("100x100bb","600x600bb"));
      } else {
        setCover(DEFAULT_COVER);
      }
    } catch { setCover(DEFAULT_COVER); }
  }

  // =========================
  // METADATA
  // =========================
  function getMountSource(data) {
    const sources = data?.icestats?.source;
    if (!sources) return null;
    if (Array.isArray(sources)) {
      return sources.find(s =>
        (s.listenurl||"").toLowerCase().includes(MOUNTPOINT.toLowerCase()) ||
        (s.server_name||"").toLowerCase().includes("sonarrock")
      ) || null;
    }
    return sources;
  }

  async function fetchNowPlayingFallback() {
    try {
      const res = await fetch(`${GISS_NOWPLAYING_URL}&t=${Date.now()}`,{ cache:"no-store" });
      if (!res.ok) return "";
      return safeDecodeText(await res.text());
    } catch { return ""; }
  }

  async function fetchMetadata() {
    try {
      const res = await fetch(`${METADATA_URL}?t=${Date.now()}`,{ cache:"no-store" });
      if (!res.ok) return;
      const data = await res.json();
      const source = getMountSource(data);
      if (!source || !source.stream_start_iso8601) {
        setStatus("Fuera de línea", false);
        resetMetadataUI();
        return;
      }
      setStatus("Transmitiendo en vivo", true);
      let rawTitle = safeDecodeText(source.title || source.artist || source.server_description || "");
      if (!rawTitle || ["-","- ,"].includes(rawTitle.trim())) {
        const fb = await fetchNowPlayingFallback();
        if (fb) rawTitle = fb;
      }
      if (!rawTitle) rawTitle = DEFAULT_TRACK_TEXT;
      if (rawTitle !== lastMetadataTitle) {
        lastMetadataTitle = rawTitle;
        const parsed = parseTitle(rawTitle);
        const finalArtist = parsed.artist || "SONAR ROCK";
        const finalTitle = parsed.title || DEFAULT_TRACK_TEXT;
        updateTrack(finalTitle, finalArtist);
        fetchAlbumArt(parsed.artist, parsed.title);
        const key = `${finalArtist} - ${finalTitle}`;
        if (key !== lastTrackShown && finalTitle !== DEFAULT_TRACK_TEXT) {
          lastTrackShown = key;
          showSongToast(key);
        }
      }
    } catch (e) { console.warn("Metadata no disponible:", e); }
  }

  function startMetadataPolling() {
    stopMetadataPolling();
    fetchMetadata();
    metadataTimer = setInterval(fetchMetadata, metadataIntervalMs);
  }

  function stopMetadataPolling() {
    if (metadataTimer) { clearInterval(metadataTimer); metadataTimer = null; }
  }

  function startPassiveMetadataPolling() {
    stopPassiveMetadataPolling();
    fetchMetadata();
    passiveMetadataTimer = setInterval(fetchMetadata, passiveMetadataIntervalMs);
  }

  function stopPassiveMetadataPolling() {
    if (passiveMetadataTimer) { clearInterval(passiveMetadataTimer); passiveMetadataTimer = null; }
  }

  // =========================
  // WEB AUDIO GRAPH
  // Se inicializa solo una vez y solo tras gesto del usuario
  // =========================
  async function initAudioGraph() {
    if (audioGraphReady) {
      if (audioContext?.state === "suspended") await audioContext.resume().catch(() => {});
      return true;
    }
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return false;

      audioContext = new AudioCtx();
      if (audioContext.state === "suspended") await audioContext.resume();

      analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.80;

      // crossOrigin debe estar seteado antes de conectar al graph
      audio.crossOrigin = "anonymous";

      sourceNode = audioContext.createMediaElementSource(audio);
      sourceNode.connect(analyser);
      analyser.connect(audioContext.destination);

      vuDataArray = new Uint8Array(analyser.frequencyBinCount);

      if (vuCanvas) canvasCtx = vuCanvas.getContext("2d");

      audioGraphReady = true;
      startVu();
      return true;
    } catch (e) {
      console.warn("Web Audio no disponible:", e);
      audioGraphReady = false;
      // Arrancar VU idle sin audio graph
      if (vuCanvas && !canvasCtx) {
        canvasCtx = vuCanvas.getContext("2d");
        startVu();
      }
      return false;
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
        if (audioContext?.state === "suspended") await audioContext.resume().catch(() => {});
        await audio.play();
        isRecovering = false;
      } catch (e) {
        console.error("Reconexión fallida:", e);
        isRecovering = false;
        recoverPlayback(true);
      }
    }, reconnectDelay);
  }

  // =========================
  // PLAY / PAUSE
  // Flujo limpio: src → crossOrigin → audioGraph → play()
  // =========================
  async function playStream() {
    try {
      clearReconnect();
      reconnectAttempts = 0;
      isUserPaused = false;
      isRecovering = false;

      setStatus("Conectando...", false);
      updatePlayUI(true); // feedback visual inmediato

      // 1. Asignar src fresco (evita caché de stream cortado)
      audio.src = `${STREAM_URL}?t=${Date.now()}`;
      audio.load();

      // 2. Inicializar audio graph (solo crea el contexto una vez)
      await initAudioGraph();

      // 3. Play
      await audio.play();

      startMetadataPolling();
    } catch (e) {
      console.error("Error al reproducir:", e);
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
    if (isPlaying) {
      pauseStream();
    } else {
      playStream();
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
  // EVENTOS AUDIO — solo reaccionan cuando corresponde
  // =========================
  audio.addEventListener("playing", () => {
    clearReconnect();
    reconnectAttempts = 0;
    isRecovering = false;
    updatePlayUI(true);
    setStatus("Transmitiendo en vivo", true);
    if (audioContext?.state === "suspended") audioContext.resume().catch(() => {});
  });

  audio.addEventListener("pause", () => {
    if (isUserPaused) updatePlayUI(false);
  });

  audio.addEventListener("waiting", () => {
    // Solo actuar si llevamos más de 8s reproduciendo (no es buffering inicial)
    if (!isPlaying || isUserPaused) return;
    setStatus("Bufferizando señal...", false);
  });

  audio.addEventListener("stalled", () => {
    if (!isPlaying || isUserPaused) return;
    setStatus("Señal detenida, recuperando...", false);
    // Dar 5s antes de forzar reconexión para no pisar el arranque
    clearTimeout(reconnectTimer);
    reconnectTimer = setTimeout(() => recoverPlayback(true), 5000);
  });

  audio.addEventListener("error", () => {
    if (!isPlaying || isUserPaused) {
      updatePlayUI(false);
      setStatus("Error al conectar con la señal", false);
      return;
    }
    setStatus("Error en la señal, recuperando...", false);
    recoverPlayback(true);
  });

  audio.addEventListener("canplay", () => {
    if (isPlaying) setStatus("Transmitiendo en vivo", true);
  });

  audio.addEventListener("volumechange", updateMuteUI);

  // =========================
  // VISIBILIDAD
  // =========================
  document.addEventListener("visibilitychange", async () => {
    if (!document.hidden) {
      if (audioContext?.state === "suspended") await audioContext.resume().catch(() => {});
      if (isPlaying && audio.paused && !isUserPaused) recoverPlayback(false);
    }
  });

  // =========================
  // MINI PLAYER
  // =========================
  function handleMiniPlayer() {
    if (!miniPlayer) return;
    miniPlayer.classList.toggle("show", window.innerWidth <= 768);
  }

  // =========================
  // VU METER — diseño mejorado
  // =========================
  const VU_BARS = 32;
  const VU_GAP = 3;
  const VU_BORDER_RADIUS = 3;
  // Picos por barra para el efecto "peak hold"
  const peakValues = new Float32Array(VU_BARS).fill(0);
  const peakDecay = 0.015;

  function resizeVuCanvas() {
    if (!vuCanvas) return;
    const rect = vuCanvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    vuCanvas.width = Math.max(260, Math.floor(rect.width * dpr));
    vuCanvas.height = Math.floor(64 * dpr);
    if (canvasCtx) canvasCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function getBarColor(normalizedValue, index, total) {
    // Gradiente por posición: izquierda azul/cyan → centro naranja → derecha rojo
    const pos = index / total;
    if (normalizedValue > 0.85) return "rgba(255,60,60,0.95)";
    if (pos < 0.4) return `rgba(53,215,255,${0.7 + normalizedValue * 0.3})`;
    if (pos < 0.7) return `rgba(255,160,40,${0.75 + normalizedValue * 0.25})`;
    return `rgba(255,100,30,${0.75 + normalizedValue * 0.25})`;
  }

  function drawVu() {
    if (!vuCanvas || !canvasCtx) return;
    const dpr = window.devicePixelRatio || 1;
    const W = vuCanvas.width / dpr;
    const H = vuCanvas.height / dpr;

    canvasCtx.clearRect(0, 0, W, H);

    const barWidth = (W - VU_GAP * (VU_BARS - 1)) / VU_BARS;
    const now = Date.now();
    const active = audioGraphReady && isPlaying && !audio.paused;

    if (active && analyser && vuDataArray) {
      analyser.getByteFrequencyData(vuDataArray);
    }

    for (let i = 0; i < VU_BARS; i++) {
      const x = i * (barWidth + VU_GAP);

      let rawValue;
      if (active && vuDataArray) {
        const step = Math.floor(vuDataArray.length / VU_BARS);
        rawValue = (vuDataArray[i * step] || 0) / 255;
      } else {
        // Idle: ondas suaves con fase diferente por barra
        const t = now / 1000;
        const wave1 = Math.sin(t * 1.1 + i * 0.28) * 0.5 + 0.5;
        const wave2 = Math.sin(t * 0.7 + i * 0.45 + 1.2) * 0.5 + 0.5;
        rawValue = (wave1 * 0.6 + wave2 * 0.4) * 0.18 + 0.04;
      }

      // Peak hold
      if (rawValue >= peakValues[i]) {
        peakValues[i] = rawValue;
      } else {
        peakValues[i] = Math.max(0, peakValues[i] - peakDecay);
      }

      const barH = Math.max(4, rawValue * (H - 4));
      const peakH = Math.max(4, peakValues[i] * (H - 4));
      const y = H - barH;

      // Barra principal
      const color = getBarColor(rawValue, i, VU_BARS);
      canvasCtx.beginPath();
      canvasCtx.roundRect
        ? canvasCtx.roundRect(x, y, barWidth, barH, VU_BORDER_RADIUS)
        : canvasCtx.rect(x, y, barWidth, barH);

      // Glow en barras activas
      if (active && rawValue > 0.3) {
        canvasCtx.shadowBlur = 8;
        canvasCtx.shadowColor = rawValue > 0.7
          ? "rgba(255,80,40,0.6)"
          : "rgba(53,215,255,0.4)";
      } else {
        canvasCtx.shadowBlur = 0;
      }

      canvasCtx.fillStyle = color;
      canvasCtx.fill();

      // Pixel de pico (peak hold)
      if (active && peakValues[i] > 0.05) {
        canvasCtx.shadowBlur = 0;
        canvasCtx.fillStyle = peakValues[i] > 0.85
          ? "rgba(255,80,60,0.95)"
          : "rgba(255,255,255,0.75)";
        canvasCtx.fillRect(x, H - peakH - 2, barWidth, 2);
      }
    }

    canvasCtx.shadowBlur = 0;
  }

  function renderVu() {
    drawVu();
    vuAnimationId = requestAnimationFrame(renderVu);
  }

  function startVu() {
    if (vuAnimationId) cancelAnimationFrame(vuAnimationId);
    renderVu();
  }

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
