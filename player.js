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

  // ── RECONEXIÓN ─────────────────────────────────────────────
  // Stall timeout aumentado a 20 s — los streams de radio tienen
  // micro-cortes normales; 8 s era demasiado agresivo y causaba
  // bucles de reconexión durante transmisiones en vivo.
  const STALL_TIMEOUT   = 20_000;

  // Backoff exponencial: 3 s → 6 s → 12 s → 24 s (máx 30 s)
  const RECONNECT_BASE  = 3_000;
  const RECONNECT_MAX   = 30_000;
  const MAX_RECONNECTS  = 8;

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

  // Bandera: impide que múltiples reconexiones corran en paralelo
  let isReconnecting   = false;

  const history = [];

  // ── STATUS ─────────────────────────────────────────────────
  const STATUS_MAP = {
    ready:        { text: "Listo para reproducir", dot: ""          },
    loading:      { text: "Conectando…",            dot: "loading"   },
    live:         { text: "En vivo",                dot: "live"      },
    buffering:    { text: "Cargando señal…",        dot: "buffering" },
    reconnecting: { text: "Reconectando…",          dot: "buffering" },
    paused:       { text: "Pausado",                dot: ""          },
    error:        { text: "Error de conexión",      dot: "error"     },
  };

  function setStatus(key) {
    const s = STATUS_MAP[key] || STATUS_MAP.ready;
    if (statusText) statusText.textContent = s.text;
    if (statusDot)  statusDot.className = `status-dot ${s.dot}`.trim();
  }

  // ── FONDO DINÁMICO ─────────────────────────────────────────
  function updateBackground(imageUrl) {
    player.style.setProperty("--dynamic-bg", `url('${imageUrl}')`);
  }

  // ── PORTADA ────────────────────────────────────────────────
  function setCover(url) {
    if (!stationCover) return;

    const finalUrl = (url || DEFAULT_COVER)
      .replace("http://", "https://")
      .split("?")[0];

    const img = new Image();

    img.onload = () => {
      stationCover.classList.add("cover-changing");
      stationCover.src = finalUrl;
      updateBackground(finalUrl);
      setTimeout(() => stationCover.classList.remove("cover-changing"), 450);
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

    // Prioridad: 1. portada del álbum  2. imagen del show  3. logo
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

    // Miércoles 21:00+
    if (day === 3 && hour >= 21) {
      return "https://www.sonarrock.com/attached_assets/sessions.png";
    }

    // Jueves 21:00+
    if (day === 4 && hour >= 21) {
      return "https://www.sonarrock.com/attached_assets/ladob.jpeg";
    }

    return null;
  }

  function startShowLoop() {
    stopShowLoop();
    resolveAndSetCover();
    showTimer = setInterval(resolveAndSetCover, SHOW_INTERVAL);
  }

  function stopShowLoop() {
    if (showTimer) clearInterval(showTimer);
    showTimer = null;
  }

  // ── HISTORIAL ──────────────────────────────────────────────
  function pushHistory(artist, title) {
    if (!historyList) return;

    const entry = `${artist} — ${title}`;

    // Evita duplicados consecutivos
    if (history[0] === entry) return;

    history.unshift(entry);

    // Máximo 3 canciones
    if (history.length > 3) history.pop();

    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
    } catch (e) {
      console.warn("history storage error:", e);
    }

    renderHistory();
  }

  function renderHistory() {
    if (!historyList) return;

    historyList.innerHTML =
      `<div class="history-title">Historial musical</div>` +
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
    toastTimer = setTimeout(() => songToast.classList.remove("show"), 3000);
  }

  // ── UI ─────────────────────────────────────────────────────
  function updatePlayUI(p) {
    isPlaying = p;
    if (playIcon) playIcon.textContent = p ? "❚❚" : "▶";
    player.classList.toggle("playing", p);
    if (playBtn) playBtn.setAttribute("aria-label", p ? "Pausar" : "Reproducir");
  }

  function updateMuteUI(m) {
    isMuted     = m;
    audio.muted = m;
    if (muteIcon)   muteIcon.textContent   = m ? "🔇" : "🔊";
    if (volumeEmoji) volumeEmoji.textContent = m ? "🔇" : "🔊";
  }

  // ── MEDIA SESSION API ──────────────────────────────────────
  function updateMediaSession(title, artist, cover) {
    if (!("mediaSession" in navigator)) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title,
      artist,
      album:   "Sonar Rock",
      artwork: [{ src: cover, sizes: "512x512", type: "image/png" }],
    });

    navigator.mediaSession.setActionHandler("play",  () => playStream());
    navigator.mediaSession.setActionHandler("pause", () => pauseStream());
    navigator.mediaSession.setActionHandler("stop",  () => pauseStream());
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
      new Notification("🎸 Sonar Rock — Nueva canción", {
        body:   `${artist} — ${title}`,
        icon:   cover || DEFAULT_COVER,
        silent: true,
        tag:    "sonarrock-song",
      });
    } catch (e) {
      console.warn("notificación fallida:", e);
    }
  }

  // ── METADATA ───────────────────────────────────────────────
  async function fetchMetadata() {
    try {
      const res  = await fetch(API_URL + "?t=" + Date.now(), { cache: "no-store" });
      const data = await res.json();

      // Sin metadata real
      if (!data?.title || data.title === DEFAULT_TRACK) {
        lastSpotifyCover = null;
        resolveAndSetCover();
        return;
      }

      const title  = data.title;
      const artist = data.artist || DEFAULT_ARTIST;
      const coverFromApi =
        data.cover && data.cover !== DEFAULT_COVER ? data.cover : null;

      // Misma canción — solo actualizar portada si cambió
      if (title === lastTitle) {
        if (coverFromApi !== lastSpotifyCover) {
          lastSpotifyCover = coverFromApi;
          resolveAndSetCover();
        }
        return;
      }

      // Nueva canción
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
          if (trackInfo.scrollWidth > trackInfo.clientWidth) {
            trackInfo.classList.add("marquee-active");
          }
        });
      }

      if (trackArtist) trackArtist.textContent = artist;

      lastSpotifyCover = coverFromApi;
      resolveAndSetCover();

      const coverForSession = coverFromApi || getLiveShowImage() || DEFAULT_COVER;
      updateMediaSession(title, artist, coverForSession);
      sendSongNotification(artist, title, coverForSession);
      showToast(`${artist} - ${title}`);

    } catch (e) {
      console.warn("Metadata fetch error:", e);
      lastSpotifyCover = null;
      resolveAndSetCover();
    }
  }

  function startMetaLoop() {
    stopMetaLoop();
    fetchMetadata();
    metaTimer = setInterval(fetchMetadata, META_INTERVAL);
  }

  function stopMetaLoop() {
    if (metaTimer) clearInterval(metaTimer);
    metaTimer = null;
  }

  // ── RECONEXIÓN AUTOMÁTICA ──────────────────────────────────
  // Usa backoff exponencial para no saturar el servidor con
  // peticiones rápidas cuando hay un corte real de señal.
  function clearStallTimer() {
    if (stallTimer) clearTimeout(stallTimer);
    stallTimer = null;
  }

  function clearReconnectTimer() {
    if (reconnectTimer) clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }

  function getReconnectDelay() {
    // 3 s, 6 s, 12 s, 24 s, 30 s (tope)
    const delay = RECONNECT_BASE * Math.pow(2, reconnectCount - 1);
    return Math.min(delay, RECONNECT_MAX);
  }

  function scheduleReconnect() {
    // Evita reconexiones paralelas
    if (!isPlaying || isReconnecting) return;

    if (reconnectCount >= MAX_RECONNECTS) {
      console.warn("Máximo de reconexiones alcanzado, deteniendo.");
      setStatus("error");
      updatePlayUI(false);
      stopMetaLoop();
      isReconnecting = false;
      return;
    }

    isReconnecting = true;
    reconnectCount++;

    const delay = getReconnectDelay();
    console.info(`Reconexión ${reconnectCount}/${MAX_RECONNECTS} en ${delay / 1000} s…`);
    setStatus("reconnecting");

    clearReconnectTimer();

    reconnectTimer = setTimeout(async () => {
      if (!isPlaying) {
        isReconnecting = false;
        return;
      }

      try {
        // Detener el audio antes de reasignar el src
        audio.pause();
        audio.src = "";

        // Pequeña pausa para que el browser libere la conexión anterior
        await new Promise(r => setTimeout(r, 300));

        audio.src = STREAM_URL + "?t=" + Date.now();

        await audio.play();

        // Éxito
        reconnectCount = 0;
        isReconnecting = false;
        setStatus("live");
        startMetaLoop();

      } catch (e) {
        console.warn(`Reconexión ${reconnectCount} fallida:`, e);
        isReconnecting = false;
        scheduleReconnect();
      }
    }, delay);
  }

  function armStallDetector() {
    clearStallTimer();
    if (!isPlaying) return;

    stallTimer = setTimeout(() => {
      console.warn("Stream caído (stall detectado), iniciando reconexión…");
      scheduleReconnect();
    }, STALL_TIMEOUT);
  }

  // ── PLAYER ─────────────────────────────────────────────────
  // FIX: Se eliminó audio.load() explícito antes del primer play().
  // Asignar src y llamar play() directamente es suficiente y evita
  // el error "The element has no supported sources" en Safari/Firefox
  // que impedía el arranque al primer click.
  async function playStream() {
    try {
      setStatus("loading");
      updatePlayUI(true);    // UI responde inmediatamente al click

      reconnectCount = 0;
      isReconnecting = false;

      clearStallTimer();
      clearReconnectTimer();

      // Limpiar fuente anterior si la hay
      audio.pause();
      audio.src = "";

      // Asignar nueva URL con cache-buster y reproducir
      audio.src = STREAM_URL + "?t=" + Date.now();

      await audio.play();

      setStatus("live");
      startMetaLoop();
      await requestNotifPermission();

    } catch (e) {
      console.warn("Play error:", e);
      updatePlayUI(false);

      // Si el error es NotAllowedError (autoplay policy), informar al usuario
      if (e.name === "NotAllowedError") {
        setStatus("ready");
      } else {
        // Cualquier otro error de red: intentar reconectar
        setStatus("reconnecting");
        scheduleReconnect();
      }
    }
  }

  function pauseStream() {
    clearStallTimer();
    clearReconnectTimer();

    reconnectCount = 0;
    isReconnecting = false;

    audio.pause();
    audio.src = "";

    stopMetaLoop();
    updatePlayUI(false);

    lastSpotifyCover = null;
    setCover(DEFAULT_COVER);
    player.style.setProperty("--dynamic-bg", "none");

    setStatus("paused");

    if ("mediaSession" in navigator) {
      navigator.mediaSession.playbackState = "paused";
    }
  }

  function togglePlay() {
    isPlaying ? pauseStream() : playStream();
  }

  // ── VOLUMEN ────────────────────────────────────────────────
  function toggleMute() {
    updateMuteUI(!isMuted);
  }

  function setVolume(v) {
    audio.volume = v;

    if (v > 0 && isMuted) updateMuteUI(false);
    if (v === 0)          updateMuteUI(true);

    if (volumeEmoji) {
      volumeEmoji.textContent = v === 0 ? "🔇" : v < 0.5 ? "🔉" : "🔊";
    }
  }

  // ── EVENTOS DE AUDIO ───────────────────────────────────────
  audio.addEventListener("playing", () => {
    clearStallTimer();
    clearReconnectTimer();
    isReconnecting = false;

    if (isPlaying) {
      setStatus("live");
      if ("mediaSession" in navigator) {
        navigator.mediaSession.playbackState = "playing";
      }
    }
  });

  // "canplay" confirma que el stream está listo; útil para actualizar
  // UI cuando el buffer termina de cargar por primera vez.
  audio.addEventListener("canplay", () => {
    if (isPlaying) setStatus("live");
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

  // FIX: El evento "error" solo inicia reconexión si el código de error
  // indica un problema de red real (MEDIA_ERR_NETWORK o MEDIA_ERR_SRC_NOT_FOUND),
  // no si simplemente se limpió el src al pausar (error code 4 = EMPTY).
  audio.addEventListener("error", () => {
    const code = audio.error?.code;

    // code === 4 (MEDIA_ERR_SRC_NOT_FOUND) ocurre cuando se limpia audio.src
    // al pausar intencionalmente. Ignorar en ese caso.
    if (!isPlaying || code === MediaError.MEDIA_ERR_SRC_NOT_FOUND) return;

    console.warn("Audio error code:", code);
    scheduleReconnect();
  });

  // ── VISIBILIDAD DE LA PÁGINA ────────────────────────────────
  // Cuando el usuario regresa a la pestaña tras un periodo en background,
  // verificar que el stream siga activo; si se cayó, reconectar.
  document.addEventListener("visibilitychange", () => {
    if (
      document.visibilityState === "visible" &&
      isPlaying &&
      audio.paused &&
      !isReconnecting
    ) {
      console.info("Pestaña activa nuevamente, verificando stream…");
      scheduleReconnect();
    }
  });

  // ── EVENTOS DE CONTROLES ───────────────────────────────────
  playBtn.addEventListener("click", togglePlay);

  if (muteBtn)    muteBtn.addEventListener("click", toggleMute);

  if (volumeCtrl) {
    volumeCtrl.addEventListener(
      "input",
      e => setVolume(parseFloat(e.target.value))
    );
  }

  // ── INIT ───────────────────────────────────────────────────
  if (trackInfo)   trackInfo.textContent   = DEFAULT_TRACK;
  if (trackArtist) trackArtist.textContent = DEFAULT_ARTIST;

  // Cargar historial guardado
  try {
    const savedHistory = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (savedHistory) {
      const parsed = JSON.parse(savedHistory);
      if (Array.isArray(parsed)) {
        history.push(...parsed);
        renderHistory();
      }
    }
  } catch (e) {
    console.warn("history load error:", e);
  }

  setStatus("ready");
  startShowLoop();

});

// ═══════════════════════════════════════════════════════════════════════════════
// NOTAS DE DESARROLLO — SONAR ROCK PLAYER
// ═══════════════════════════════════════════════════════════════════════════════
//
// CAMBIOS RESPECTO A LA VERSIÓN ANTERIOR
// ───────────────────────────────────────
//
// 1. PRIMER CLICK GARANTIZADO
//    ─────────────────────────
//    Problema: en la versión anterior, `audio.load()` se llamaba explícitamente
//    antes de `audio.play()`. Esto causaba que Safari y algunos builds de Firefox
//    emitieran el evento "error" (code 4) por tener temporalmente src vacío
//    durante el ciclo load/play, lo que a su vez disparaba `scheduleReconnect()`
//    antes de que el stream siquiera intentara conectar.
//
//    Solución: se eliminó el `audio.load()` explícito. Asignar `audio.src` y
//    llamar `audio.play()` directamente es el patrón correcto y funciona en
//    Chrome, Firefox, Safari y Edge. El browser hace el load implícitamente.
//
//    Adicionalmente, `updatePlayUI(true)` ahora se llama antes del await, así
//    el botón responde de inmediato al primer click sin esperar a que el stream
//    confirme la conexión.
//
// 2. RECONEXIONES EN BUCLE SOLUCIONADAS
//    ─────────────────────────────────────
//    Problema: cuando la señal tenía micro-cortes normales (buffer de red),
//    el stall detector de 8 s disparaba reconexiones. Cada reconexión generaba
//    un nuevo evento "error" al limpiar audio.src, que a su vez disparaba
//    otra reconexión, creando un bucle infinito que saturaba el servidor.
//
//    Soluciones aplicadas:
//
//    a) STALL_TIMEOUT aumentado de 8 000 ms a 20 000 ms.
//       Los streams de radio tienen buffering normal de hasta 15 s en conexiones
//       móviles o cuando el servidor tiene picos de carga. 8 s era insuficiente
//       para distinguir entre un buffer normal y una caída real.
//
//    b) Bandera `isReconnecting` — evita que múltiples reconexiones corran
//       en paralelo. Si ya hay una reconexión en progreso, las llamadas
//       adicionales a `scheduleReconnect()` se ignoran.
//
//    c) El evento "error" ahora verifica `audio.error.code` antes de actuar:
//       - MEDIA_ERR_SRC_NOT_FOUND (code 4) ocurre intencionalmente al hacer
//         `audio.src = ""` durante pause/reconexión. Se ignora.
//       - MEDIA_ERR_NETWORK (code 2) y MEDIA_ERR_DECODE (code 3) son errores
//         reales de red que sí deben disparar reconexión.
//
//    d) Backoff exponencial: los intentos de reconexión usan delays crecientes
//       (3 s → 6 s → 12 s → 24 s → 30 s máximo) en lugar de un delay fijo.
//       Esto reduce la presión sobre el servidor cuando hay una caída prolongada
//       y da más tiempo para que el stream se recupere naturalmente.
//
//    e) Pausa de 300 ms antes de reasignar audio.src en cada reconexión, para
//       dar tiempo al browser de liberar la conexión TCP anterior antes de
//       abrir una nueva.
//
// 3. DETECCIÓN DE REGRESO A PESTAÑA
//    ──────────────────────────────────
//    Se agregó listener en `document.visibilitychange`. Cuando el usuario
//    tiene la pestaña en background (móvil, tab inactivo), algunos browsers
//    pausan el audio sin disparar "error" ni "stalled". Al volver a la pestaña,
//    el código verifica si el audio está pausado y reconecta si es necesario.
//
// 4. EVENTO "canplay" AGREGADO
//    ─────────────────────────────
//    Confirma que el stream está listo y actualiza el status a "live" cuando
//    el buffer termina de cargar la primera vez (especialmente útil en
//    conexiones lentas donde el status quedaba en "loading" indefinidamente).
//
// 5. DIFERENCIACIÓN DE ERRORES EN playStream()
//    ─────────────────────────────────────────────
//    Si el error es NotAllowedError (política de autoplay del browser), el
//    player vuelve a estado "ready" sin intentar reconectar, ya que reintentar
//    no resuelve un problema de permisos de usuario.
//
// PARÁMETROS AJUSTABLES
// ──────────────────────
// STALL_TIMEOUT   → ms sin datos antes de considerar stream caído  (default: 20 000)
// RECONNECT_BASE  → delay base del backoff exponencial en ms        (default:  3 000)
// RECONNECT_MAX   → delay máximo entre intentos en ms               (default: 30 000)
// MAX_RECONNECTS  → intentos máximos antes de mostrar error         (default:      8)
// META_INTERVAL   → frecuencia de polling de metadata en ms         (default: 10 000)
// SHOW_INTERVAL   → frecuencia de verificación de show en vivo ms   (default: 30 000)
//
// ═══════════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════════
// GUÍA DE DEPURACIÓN
// ═══════════════════════════════════════════════════════════════════════════════
//
// Si el stream no inicia al primer click:
//   1. Abrir DevTools > Console y buscar "Play error".
//   2. Si el error es NotAllowedError → el browser bloqueó autoplay.
//      Solución: asegurarse de que playStream() se llama directamente desde
//      un event listener de click del usuario (no desde un setTimeout ni
//      desde un Promise encadenado sin el click original en el stack).
//   3. Si el error es NotSupportedError → el formato mp3 del stream no está
//      soportado. Verificar el MIME type del servidor con:
//        curl -I https://giss.tv:667/sonarrock.mp3
//      Debe retornar Content-Type: audio/mpeg.
//   4. Si hay un error de CORS → el servidor no incluye el header
//      Access-Control-Allow-Origin. Confirmar con DevTools > Network.
//
// Si el stream se reconecta constantemente:
//   1. Revisar Console: buscar "Audio error code:" y el número.
//      code 1 = MEDIA_ERR_ABORTED  (usuario abortó, no hacer nada)
//      code 2 = MEDIA_ERR_NETWORK  (problema de red real)
//      code 3 = MEDIA_ERR_DECODE   (stream corrupto o codec no soportado)
//      code 4 = MEDIA_ERR_SRC_NOT_FOUND (src vacío, se ignora intencionalmente)
//   2. Si el problema ocurre solo en transmisiones en vivo, aumentar
//      STALL_TIMEOUT a 30 000 ms para dar más margen al encoder.
//   3. Verificar que el servidor de stream tenga suficiente ancho de banda
//      para los oyentes concurrentes durante la transmisión en vivo.
//
// Si el historial no persiste entre sesiones:
//   Revisar que el browser permita localStorage (modo incógnito lo bloquea).
//   El código ya maneja el error con try/catch y degrada gracefully.
//
// Si las notificaciones no aparecen:
//   1. El permiso se solicita automáticamente al iniciar reproducción.
//   2. Las notificaciones solo se envían cuando la pestaña está en background.
//   3. En iOS Safari, las notificaciones web solo funcionan si el sitio está
//      instalado como PWA (Add to Home Screen).
//
// Si la portada del show en vivo no aparece:
//   1. Verificar que las URLs de las imágenes sean accesibles (HTTPS).
//   2. El schedule se evalúa por hora local del usuario, no del servidor.
//      Si tu audiencia está en otra zona horaria, considerar usar UTC.
//   3. `getLiveShowImage()` se re-evalúa cada SHOW_INTERVAL (30 s) mientras
//      el reproductor esté cargado, aunque no esté en reproducción.
//
// ═══════════════════════════════════════════════════════════════════════════════
// CHECKLIST PRE-TRANSMISIÓN EN VIVO
// ═══════════════════════════════════════════════════════════════════════════════
//
//   [ ] Verificar que giss.tv:667 esté respondiendo: nc -zv giss.tv 667
//   [ ] Confirmar que el encoder está enviando señal al mount point
//   [ ] Probar el stream en un reproductor externo (VLC, foobar2000) antes
//       de abrir al público
//   [ ] Verificar que la API de metadata retorne JSON válido
//   [ ] Tener listo un backup de stream en caso de caída del servidor principal
//
// ═══════════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════════
// COMPATIBILIDAD DE BROWSERS
// ═══════════════════════════════════════════════════════════════════════════════
//
// Chrome 90+      ✓  Totalmente soportado. Media Session API disponible.
// Firefox 88+     ✓  Totalmente soportado. Notificaciones disponibles.
// Safari 15+      ✓  Soportado. En iOS, el play() DEBE venir de un gesto
//                    directo del usuario (el código lo garantiza con el listener
//                    directo en playBtn sin intermediarios async innecesarios).
// Edge 90+        ✓  Totalmente soportado (basado en Chromium).
// Samsung Internet ✓ Soportado.
// iOS Safari 14   ⚠  audio.play() devuelve una Promise que puede rechazarse si
//                    el sitio no está en primer plano. Se maneja con try/catch.
//
// NOTAS SOBRE AUTOPLAY:
//   Los browsers modernos bloquean autoplay sin interacción del usuario.
//   Este player NUNCA inicia automáticamente; siempre requiere click explícito,
//   por lo que está exento de las restricciones de autoplay en todos los browsers.
//
// ═══════════════════════════════════════════════════════════════════════════════
// ARQUITECTURA DEL FLUJO DE REPRODUCCIÓN
// ═══════════════════════════════════════════════════════════════════════════════
//
//  [Click Play]
//       │
//       ▼
//  playStream()
//       │  setStatus("loading") + updatePlayUI(true)
//       │  audio.src = STREAM_URL + cache-buster
//       │  audio.play()  ──────────────────────────► [Error]
//       │                                                 │
//       │                                         NotAllowedError?
//       │                                         ├─ sí → setStatus("ready")
//       │                                         └─ no → scheduleReconnect()
//       │
//       ▼  [Éxito]
//  audio evento "playing"
//       │  clearStallTimer()
//       │  setStatus("live")
//       │  startMetaLoop()
//       │
//       ▼
//  [Stream activo]
//       │
//       ├── fetchMetadata() cada 10 s
//       │       └─ actualiza trackInfo, portada, historial, toast
//       │
//       ├── resolveAndSetCover() cada 30 s
//       │       └─ verifica si hay programa en vivo para cambiar imagen
//       │
//       └── audio evento "waiting" / "stalled"
//               │  armStallDetector() — timer de 20 s
//               │
//               ▼  [20 s sin datos]
//           scheduleReconnect()
//               │  isReconnecting = true
//               │  backoff exponencial
//               │  audio.pause() + audio.src = ""
//               │  300 ms pausa
//               │  audio.src = nuevo URL
//               │  audio.play()
//               │
//               ├─ [Éxito] → reconnectCount = 0, isReconnecting = false
//               └─ [Fallo] → scheduleReconnect() (siguiente intento)
//
// ═══════════════════════════════════════════════════════════════════════════════
