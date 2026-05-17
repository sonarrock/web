document.addEventListener("DOMContentLoaded", () => {
 
  // ── ELEMENTOS ──────────────────────────────────────────────
  const audio        = document.getElementById("radioPlayer");
  const playBtn      = document.getElementById("playBtn");
  const playIcon     = document.getElementById("playIcon");
  const muteBtn      = document.getElementById("muteBtn");
  const muteIcon     = document.getElementById("muteIcon");
  const volumeCtrl   = document.getElementById("volumeControl");
  const volumeEmoji  = document.getElementById("volumeEmoji");
  const trackInfo    = document.getElementById("trackInfo");
  const trackArtist  = document.getElementById("trackArtist");
  const stationCover = document.getElementById("stationCover");
  const statusText   = document.getElementById("statusText");
  const statusDot    = document.getElementById("statusDot");
  const player       = document.getElementById("sonarPlayer");
  const historyList  = document.getElementById("historyList");
  const songToast    = document.getElementById("songToast");
  const toastSong    = document.getElementById("toastSong");
 
  if (!audio || !playBtn || !player) return;
 
  // ── CONSTANTES ─────────────────────────────────────────────
  const STREAM_URL      = "https://giss.tv:667/sonarrock.mp3";
  const API_URL         = "https://sonarrock-api.cmrm1982.workers.dev/";
  const DEFAULT_COVER   = "https://www.sonarrock.com/attached_assets/logo_1749601460841.jpeg";
  const DEFAULT_TRACK   = "Transmitiendo rock sin payola!";
  const DEFAULT_ARTIST  = "SONAR ROCK";
  const META_INTERVAL   = 10_000;
  const SHOW_INTERVAL   = 30_000;
  const STALL_TIMEOUT   = 8_000;
  const RECONNECT_DELAY = 3_000;
  const MAX_RECONNECTS  = 10;

  const HISTORY_STORAGE_KEY = "sonarrock-history";
 
  // ── ESTADO ─────────────────────────────────────────────────
  let isPlaying        = false;
  let isMuted          = false;
  let lastTitle        = "";
  let lastSpotifyCover = null;
  let metaTimer        = null;
  let showTimer        = null;
  let toastTimer       = null;
  let stallTimer       = null;
  let reconnectTimer   = null;
  let reconnectCount   = 0;

  const history = [];
 
  // ── STATUS ─────────────────────────────────────────────────
  const STATUS_MAP = {
    ready:        { text: "Listo para reproducir", dot: ""          },
    loading:      { text: "Conectando…",            dot: "loading"   },
    live:         { text: "En vivo",                dot: "live"      },
    buffering:    { text: "Cargando señal…",        dot: "buffering" },
    reconnecting: { text: "Reconectando…",          dot: "buffering" },
    paused:       { text: "Pausado",                dot: "pausado"          },
    error:        { text: "Error de conexión",      dot: "error"     },
  };
 
  function setStatus(key) {

    const s = STATUS_MAP[key] || STATUS_MAP.ready;

    if (statusText) {
      statusText.textContent = s.text;
    }

    if (statusDot) {
      statusDot.className = `status-dot ${s.dot}`.trim();
    }
  }
 
  // ── FONDO DINÁMICO ─────────────────────────────────────────
  function updateBackground(imageUrl) {

    player.style.setProperty(
      "--dynamic-bg",
      `url('${imageUrl}')`
    );
  }
 
// ── PORTADA ────────────────────────────────
function setCover(url) {

  if (!stationCover) return;

  const finalUrl =
    (url || DEFAULT_COVER)
      .replace("http://", "https://")
      .split("?")[0];

  const img = new Image();

  img.onload = () => {

    stationCover.classList.add("cover-changing");

    stationCover.src = finalUrl;

    updateBackground(finalUrl);

    setTimeout(() => {

      stationCover.classList.remove("cover-changing");

    }, 450);
  };

  img.onerror = () => {

    stationCover.src = DEFAULT_COVER;

    updateBackground(DEFAULT_COVER);
  };

  img.src = finalUrl;
}

// ── LÓGICA CENTRAL DE PORTADA ──────────────────────────────
function resolveAndSetCover() {

  const showImg = getLiveShowImage();

  // prioridad:
  // 1. portada del álbum
  // 2. imagen del show en vivo
  // 3. logo default

  if (lastSpotifyCover) {

    setCover(lastSpotifyCover);

    player.classList.remove("show-live");

  } else if (showImg) {

    setCover(showImg);

    player.classList.add("show-live");

  } else {

    setCover(DEFAULT_COVER);

    player.classList.remove("show-live");
  }
}
 
 
  // ── PROGRAMAS EN VIVO ──────────────────────────────────────
  function getLiveShowImage() {

    const d    = new Date();
    const day  = d.getDay();
    const hour = d.getHours();

    if (day === 3 && hour >= 21) {
      return "/attached_assets/session.jpg";
    }

    if (day === 4 && hour >= 21) {
      return "/attached_assets/ladoB.jpg";
    }

    return null;
  }
 
  function startShowLoop() {

    stopShowLoop();

    resolveAndSetCover();

    showTimer = setInterval(
      resolveAndSetCover,
      SHOW_INTERVAL
    );
  }
 
  function stopShowLoop() {

    if (showTimer) {
      clearInterval(showTimer);
    }

    showTimer = null;
  }
 
  // ── HISTORIAL ──────────────────────────────────────────────
  function pushHistory(artist, title) {

    if (!historyList) return;

    const entry = `${artist} — ${title}`;

    // evita duplicados consecutivos
    if (history[0] === entry) return;

    history.unshift(entry);

    // máximo 3 canciones
    if (history.length > 3) {
      history.pop();
    }

    // guardar historial
    try {

      localStorage.setItem(
        HISTORY_STORAGE_KEY,
        JSON.stringify(history)
      );

    } catch (e) {

      console.warn("history storage error:", e);
    }

    renderHistory();
  }

  function renderHistory() {

    if (!historyList) return;

    historyList.innerHTML =

      `<div class="history-title">
        Historial musical
      </div>` +

      history
        .map((t, i) => `
          <div class="history-item${i === 0 ? " history-now" : ""}">
            ${t}
          </div>
        `)
        .join("");
  }
 
  // ── TOAST ──────────────────────────────────────────────────
  function showToast(text) {

    if (!songToast || !toastSong) return;

    toastSong.textContent = text;

    songToast.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
      songToast.classList.remove("show");
    }, 3000);
  }
 
  // ── UI ─────────────────────────────────────────────────────
  function updatePlayUI(p) {

    isPlaying = p;

    if (playIcon) {
      playIcon.textContent = p ? "❚❚" : "▶";
    }

    player.classList.toggle("playing", p);

    if (playBtn) {
      playBtn.setAttribute(
        "aria-label",
        p ? "Pausar" : "Reproducir"
      );
    }
  }
 
  function updateMuteUI(m) {

    isMuted     = m;
    audio.muted = m;

    if (muteIcon) {
      muteIcon.textContent = m ? "🔇" : "🔊";
    }

    if (volumeEmoji) {
      volumeEmoji.textContent = m ? "🔇" : "🔊";
    }
  }
 
  // ── MEDIA SESSION API ──────────────────────────────────────
  function updateMediaSession(title, artist, cover) {

    if (!("mediaSession" in navigator)) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title,
      artist,
      album: "Sonar Rock",
      artwork: [{
        src: cover,
        sizes: "512x512",
        type: "image/png"
      }]
    });

    navigator.mediaSession.setActionHandler(
      "play",
      () => playStream()
    );

    navigator.mediaSession.setActionHandler(
      "pause",
      () => pauseStream()
    );

    navigator.mediaSession.setActionHandler(
      "stop",
      () => pauseStream()
    );
  }
 
  // ── NOTIFICACIONES ─────────────────────────────────────────
  async function requestNotifPermission() {

    if (!("Notification" in window)) return;

    if (Notification.permission === "default") {
      await Notification.requestPermission();
    }
  }
 
  function sendSongNotification(artist, title, cover) {

    if (!("Notification" in window)) return;

    if (Notification.permission !== "granted") return;

    if (document.visibilityState === "visible") return;

    try {

      new Notification(
        "🎸 Sonar Rock — Nueva canción",
        {
          body: `${artist} — ${title}`,
          icon: cover || DEFAULT_COVER,
          silent: true,
          tag: "sonarrock-song",
        }
      );

    } catch (e) {

      console.warn("notificación fallida:", e);
    }
  }
 
  // ── METADATA ───────────────────────────────────────────────
  async function fetchMetadata() {

    try {

      const res = await fetch(
        API_URL + "?t=" + Date.now(),
        {
          cache: "no-store"
        }
      );

      const data = await res.json();
 
      if (!data?.title || data.title === DEFAULT_TRACK) {
        return;
      }
 
      const title  = data.title;
      const artist = data.artist || DEFAULT_ARTIST;
 
      const coverFromApi =
        data.cover &&
        data.cover !== DEFAULT_COVER
          ? data.cover
          : null;
 
      // misma canción
      if (title === lastTitle) {

        if (coverFromApi !== lastSpotifyCover) {

          lastSpotifyCover = coverFromApi;

          resolveAndSetCover();
        }

        return;
      }
 
      // nueva canción
      if (lastTitle) {

        pushHistory(
          trackArtist?.textContent || DEFAULT_ARTIST,
          lastTitle
        );
      }

      lastTitle = title;
 
      if (trackInfo) {

  trackInfo.textContent = title;

  requestAnimationFrame(() => {

    trackInfo.classList.remove("marquee-active");

    if (
      trackInfo.scrollWidth >
      trackInfo.clientWidth
    ) {

      trackInfo.classList.add("marquee-active");
    }
  });
}

      if (trackArtist) {
        trackArtist.textContent = artist;
      }
 
      lastSpotifyCover = coverFromApi;

      resolveAndSetCover();
 
      const coverForSession =
        coverFromApi ||
        getLiveShowImage() ||
        DEFAULT_COVER;

      updateMediaSession(
        title,
        artist,
        coverForSession
      );

      sendSongNotification(
        artist,
        title,
        coverForSession
      );

      showToast(`${artist} - ${title}`);
 
    } catch (e) {

      console.warn("Metadata fetch error:", e);
    }
  }
 
  function startMetaLoop() {

    stopMetaLoop();

    fetchMetadata();

    metaTimer = setInterval(
      fetchMetadata,
      META_INTERVAL
    );
  }
 
  function stopMetaLoop() {

    if (metaTimer) {
      clearInterval(metaTimer);
    }

    metaTimer = null;
  }
 
  // ── RECONEXIÓN AUTOMÁTICA ──────────────────────────────────
  function clearStallTimer() {

    if (stallTimer) {
      clearTimeout(stallTimer);
    }

    stallTimer = null;
  }
 
  function clearReconnectTimer() {

    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
    }

    reconnectTimer = null;
  }
 
  function scheduleReconnect() {

    if (!isPlaying) return;

    if (reconnectCount >= MAX_RECONNECTS) {

      setStatus("error");

      updatePlayUI(false);

      stopMetaLoop();

      return;
    }

    reconnectCount++;

    setStatus("reconnecting");

    clearReconnectTimer();

    reconnectTimer = setTimeout(async () => {

      if (!isPlaying) return;

      try {

        audio.src =
          STREAM_URL + "?t=" + Date.now();

        audio.load();

        await audio.play();

        reconnectCount = 0;

        setStatus("live");

        startMetaLoop();

      } catch (e) {

        console.warn(
          `reconexión ${reconnectCount} fallida:`,
          e
        );

        scheduleReconnect();
      }

    }, RECONNECT_DELAY);
  }
 
  function armStallDetector() {

    clearStallTimer();

    if (!isPlaying) return;

    stallTimer = setTimeout(() => {

      console.warn(
        "stream caído, iniciando reconexión…"
      );

      scheduleReconnect();

    }, STALL_TIMEOUT);
  }
 
  // ── PLAYER ─────────────────────────────────────────────────
  async function playStream() {

    try {

      setStatus("loading");

      reconnectCount = 0;
 
      audio.src =
        STREAM_URL + "?t=" + Date.now();

      audio.load();

      await audio.play();
 
      updatePlayUI(true);

      setStatus("live");

      startMetaLoop();

      await requestNotifPermission();
 
    } catch (e) {

      console.warn("Play error:", e);

      setStatus("ready");

      updatePlayUI(false);
    }
  }
 
  function pauseStream() {

    clearStallTimer();

    clearReconnectTimer();

    reconnectCount = 0;

    audio.pause();

    audio.src = "";

    stopMetaLoop();

    updatePlayUI(false);

    setStatus("paused");

    if ("mediaSession" in navigator) {

      navigator.mediaSession.playbackState =
        "paused";
    }
  }
 
  function togglePlay() {

    isPlaying
      ? pauseStream()
      : playStream();
  }
 
  // ── VOLUMEN ────────────────────────────────────────────────
  function toggleMute() {

    updateMuteUI(!isMuted);
  }
 
  function setVolume(v) {

    audio.volume = v;

    if (v > 0 && isMuted) {
      updateMuteUI(false);
    }

    if (v === 0) {
      updateMuteUI(true);
    }

    if (volumeEmoji) {

      volumeEmoji.textContent =
        v === 0
          ? "🔇"
          : v < 0.5
            ? "🔉"
            : "🔊";
    }
  }
 
  // ── EVENTOS DE AUDIO ───────────────────────────────────────
  audio.addEventListener("playing", () => {

    clearStallTimer();

    clearReconnectTimer();

    if (isPlaying) {

      setStatus("live");

      if ("mediaSession" in navigator) {

        navigator.mediaSession.playbackState =
          "playing";
      }
    }
  });
 
  audio.addEventListener("waiting", () => {

    if (isPlaying) {

      setStatus("buffering");

      armStallDetector();
    }
  });
 
  audio.addEventListener("stalled", () => {

    if (isPlaying) {

      setStatus("buffering");

      armStallDetector();
    }
  });
 
  audio.addEventListener("error", () => {

    if (isPlaying) {

      scheduleReconnect();

    } else {

      setStatus("error");

      stopMetaLoop();

      updatePlayUI(false);
    }
  });
 
  // ── EVENTOS DE CONTROLES ───────────────────────────────────
  playBtn.addEventListener(
    "click",
    togglePlay
  );

  if (muteBtn) {
    muteBtn.addEventListener(
      "click",
      toggleMute
    );
  }

  if (volumeCtrl) {

    volumeCtrl.addEventListener(
      "input",
      e => setVolume(parseFloat(e.target.value))
    );
  }
 
  // ── INIT ───────────────────────────────────────────────────
  if (trackInfo) {
    trackInfo.textContent = DEFAULT_TRACK;
  }

  if (trackArtist) {
    trackArtist.textContent = DEFAULT_ARTIST;
  }

  // cargar historial guardado
  try {

    const savedHistory =
      localStorage.getItem(HISTORY_STORAGE_KEY);

    if (savedHistory) {

      const parsedHistory =
        JSON.parse(savedHistory);

      if (Array.isArray(parsedHistory)) {

        history.push(...parsedHistory);

        renderHistory();
      }
    }

  } catch (e) {

    console.warn("history load error:", e);
  }
 
  setStatus("ready");

  startShowLoop();
 
});
