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
  const player       = document.querySelector(".sonar-player");
  const historyList  = document.getElementById("historyList");

  if (!audio || !playBtn) return;

  // ── CONSTANTES ─────────────────────────────────────────────
  const STREAM_URL    = "https://giss.tv:667/sonarrock.mp3";
  const API_URL       = "https://sonarrock-api.cmrm1982.workers.dev/";
  const DEFAULT_COVER = "/attached_assets/logo_1749601460841.jpeg";
  const META_INTERVAL = 5_000;   // ms entre fetch de metadata
  const SHOW_INTERVAL = 30_000;  // ms entre revisiones de horario en vivo

  // ── ESTADO ────────────────────────────────────────────────
  let isPlaying  = false;
  let isMuted    = false;
  let lastMeta   = "";
  let lastBg     = "";           // última URL aplicada al fondo
  let metaTimer  = null;
  let showTimer  = null;
  const history  = [];           // máx 5 canciones anteriores

  // ── PROGRAMAS EN VIVO ─────────────────────────────────────
  // Retorna la imagen de show si hay programa en vivo, o null.
  function getLiveShowImage() {
    const d    = new Date();
    const day  = d.getDay();   // 0=dom … 6=sáb
    const hour = d.getHours();

    if (day === 3 && hour >= 21) return "/attached_assets/session.jpg";  // miércoles 21 h+
    if (day === 4 && hour >= 21) return "/attached_assets/ladoB.jpg";    // jueves 21 h+
    return null;
  }

  // ── FONDO DINÁMICO ────────────────────────────────────────
  // Aplica un fondo solo si cambió realmente.
  function applyBackground(url) {
    if (!url || url === lastBg) return;
    lastBg = url;

    const img    = new Image();
    img.onload   = () => {
      player.style.setProperty("--dynamic-bg", `url('${url}')`);
      stationCover.src = url;
    };
    img.onerror  = () => {
      player.style.setProperty("--dynamic-bg", `url('${DEFAULT_COVER}')`);
      stationCover.src = DEFAULT_COVER;
    };
    img.src = url;
  }

  // Revisa si hay programa en vivo y actualiza el fondo.
  // Se puede llamar desde el loop de show O desde fetchMeta.
  function refreshBackground(coverFromApi) {
    const showImg = getLiveShowImage();

    // El show tiene prioridad; si no hay show, usa la portada de la API.
    applyBackground(showImg || coverFromApi || DEFAULT_COVER);

    // Clase visual para el borde rojo pulsante
    player.classList.toggle("show-live", !!showImg);
  }

  // Loop independiente para actualizar el fondo por horario
  // (funciona aunque el usuario no esté reproduciendo).
  function startShowLoop() {
    stopShowLoop();
    refreshBackground(null);                        // revisión inmediata
    showTimer = setInterval(() => refreshBackground(null), SHOW_INTERVAL);
  }

  function stopShowLoop() {
    if (showTimer) clearInterval(showTimer);
    showTimer = null;
  }

  // ── HISTORIAL ─────────────────────────────────────────────
  function pushHistory(artist, title) {
    if (!historyList) return;
    const entry = `${artist} — ${title}`;
    if (history[0] === entry) return;          // evita duplicado al inicio
    history.unshift(entry);
    if (history.length > 5) history.pop();

    historyList.innerHTML =
      `<div class="history-title">Historial musical</div>` +
      history
        .map((t, i) => `<div class="history-item${i === 0 ? " history-now" : ""}">${t}</div>`)
        .join("");
  }

  // ── STATUS ────────────────────────────────────────────────
  const STATUS_MAP = {
    loading:  "Conectando…",
    live:     "En vivo",
    buffering:"Buffering…",
    paused:   "Pausado",
    error:    "Sin señal",
    ready:    "Listo para reproducir"
  };

  function setStatus(s) {
    if (statusText) statusText.textContent = STATUS_MAP[s] ?? s;
    if (statusDot)  statusDot.className    = `status-dot status-${s}`;
  }

  // ── UI ────────────────────────────────────────────────────
  function updatePlayUI(p) {
    isPlaying           = p;
    playIcon.textContent = p ? "❚❚" : "▶";
    player.classList.toggle("playing", p);
    playBtn.setAttribute("aria-label", p ? "Pausar" : "Reproducir");
  }

  function updateMuteUI(m) {
    isMuted              = m;
    audio.muted          = m;
    muteIcon.textContent = m ? "🔇" : "🔊";
    if (volumeEmoji) volumeEmoji.textContent = m ? "🔇" : "🔊";
  }

  // ── METADATA ──────────────────────────────────────────────
  async function fetchMeta() {
    try {
      const res  = await fetch(`${API_URL}?t=${Date.now()}`, { cache: "no-store" });
      if (!res.ok) return;

      const data = await res.json();
      if (!data?.title) return;

      const artist = data.artist || "SONAR ROCK";
      const title  = data.title  || "Transmitiendo rock";
      const meta   = `${artist}|||${title}`;   // separador seguro

      if (meta !== lastMeta) {
        // Hay canción nueva: mueve la anterior al historial
        if (lastMeta) {
          const [pa, pt] = lastMeta.split("|||");
          pushHistory(pa, pt);
        }
        lastMeta = meta;
        trackInfo.textContent   = title;
        trackArtist.textContent = artist;
      }

      // Siempre intenta actualizar el fondo (show puede haber cambiado)
      refreshBackground(data.cover || null);

    } catch (e) {
      console.warn("metadata error", e);
    }
  }

  function startMetaLoop() {
    stopMetaLoop();
    fetchMeta();
    metaTimer = setInterval(fetchMeta, META_INTERVAL);
  }

  function stopMetaLoop() {
    if (metaTimer) clearInterval(metaTimer);
    metaTimer = null;
  }

  // ── PLAYER ────────────────────────────────────────────────
  // 🔥 PRE-CONEXIÓN: cargamos el stream en pausa para que el buffer
  //    arranque sin delay cuando el usuario presione play.
  function preconnect() {
    audio.src     = STREAM_URL;
    audio.preload = "none";   // no descarga datos aún, solo reserva conexión
    audio.load();
  }

  async function play() {
    try {
      setStatus("loading");

      // Si el src ya es el correcto, no lo reasignamos (evita reconexión)
      if (!audio.src || !audio.src.includes("sonarrock")) {
        audio.src = STREAM_URL;
      }

      await audio.play();
      updatePlayUI(true);
      setStatus("live");
      startMetaLoop();

    } catch (e) {
      console.warn("play error:", e);
      setStatus("error");
      updatePlayUI(false);
    }
  }

  function pause() {
    audio.pause();
    // Liberar buffer pero mantener src para reconexión rápida
    audio.src = "";
    stopMetaLoop();
    updatePlayUI(false);
    setStatus("paused");
  }

  function toggle() {
    isPlaying ? pause() : play();
  }

  // ── VOLUMEN ───────────────────────────────────────────────
  function toggleMute() {
    updateMuteUI(!isMuted);
  }

  function setVolume(v) {
    audio.volume = v;
    // Si el usuario sube el volumen estando muteado, desmutear
    if (v > 0 && isMuted) updateMuteUI(false);
    if (v === 0)           updateMuteUI(true);
    if (volumeEmoji) volumeEmoji.textContent = v === 0 ? "🔇" : v < 0.5 ? "🔉" : "🔊";
  }

  // ── EVENTOS ───────────────────────────────────────────────
  playBtn.addEventListener("click", toggle);
  muteBtn.addEventListener("click", toggleMute);

  if (volumeCtrl) {
    volumeCtrl.addEventListener("input", e => setVolume(parseFloat(e.target.value)));
  }

  audio.addEventListener("playing", () => { if (isPlaying) setStatus("live"); });
  audio.addEventListener("waiting", () => { if (isPlaying) setStatus("buffering"); });
  audio.addEventListener("stalled", () => { if (isPlaying) setStatus("buffering"); });
  audio.addEventListener("error",   () => { setStatus("error"); stopMetaLoop(); updatePlayUI(false); });

  // ── INIT ──────────────────────────────────────────────────
  trackInfo.textContent   = "Transmitiendo rock sin concesiones";
  trackArtist.textContent = "SONAR ROCK";

  setStatus("ready");
  startShowLoop();   // revisa horario de shows desde el inicio (sin necesidad de reproducir)
  preconnect();      // pre-conecta el stream para play instantáneo

});
