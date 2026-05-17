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

  // Guardia principal: si faltan elementos críticos, no arranca nada
  if (!audio || !playBtn || !player) return;

  // ── CONSTANTES ─────────────────────────────────────────────
  const STREAM_URL    = "https://giss.tv:667/sonarrock.mp3";
  const API_URL       = "https://sonarrock-api.cmrm1982.workers.dev/";
  const DEFAULT_COVER = "/attached_assets/logo_1749601460841.jpeg";
  const META_INTERVAL = 5_000;   // ms entre fetch de metadata
  const SHOW_INTERVAL = 30_000;  // ms entre revisiones de horario en vivo

  // ── ESTADO ─────────────────────────────────────────────────
  let isPlaying = false;
  let isMuted   = false;
  let lastMeta  = "";
  let lastBg    = "";
  let metaTimer = null;
  let showTimer = null;
  let toastTimer = null;
  const history = [];  // máx 5 canciones anteriores

  // ── STATUS ─────────────────────────────────────────────────
  const STATUS_MAP = {
    ready:      { text: "Listo para reproducir", dot: ""          },
    loading:    { text: "Conectando…",            dot: "loading"   },
    live:       { text: "En vivo",                dot: "live"      },
    buffering:  { text: "Cargando señal…",        dot: "buffering" },
    paused:     { text: "Pausado",                dot: ""          },
    error:      { text: "Error de conexión",      dot: "error"     },
  };

  function setStatus(key) {
    const s = STATUS_MAP[key] || STATUS_MAP.ready;
    if (statusText) statusText.textContent = s.text;
    if (statusDot)  statusDot.className    = `status-dot ${s.dot}`.trim();
  }

  // ── PROGRAMAS EN VIVO ──────────────────────────────────────
  function getLiveShowImage() {
    const d    = new Date();
    const day  = d.getDay();    // 0=dom … 6=sáb
    const hour = d.getHours();

    if (day === 3 && hour >= 21) return "/attached_assets/session.jpg"; // miércoles 21 h+
    if (day === 4 && hour >= 21) return "/attached_assets/ladoB.jpg";   // jueves 21 h+
    return null;
  }

  // ── FONDO DINÁMICO ─────────────────────────────────────────
  function applyBackground(url) {
    if (!url || url === lastBg) return;
    lastBg = url;

    const img   = new Image();
    img.onload  = () => {
      player.style.setProperty("--dynamic-bg", `url('${url}')`);
      if (stationCover) stationCover.src = url;
    };
    img.onerror = () => {
      player.style.setProperty("--dynamic-bg", `url('${DEFAULT_COVER}')`);
      if (stationCover) stationCover.src = DEFAULT_COVER;
    };
    img.src = url;
  }

  function refreshBackground(coverFromApi) {
    const showImg = getLiveShowImage();
    applyBackground(showImg || coverFromApi || DEFAULT_COVER);
    player.classList.toggle("show-live", !!showImg);
  }

  function startShowLoop() {
    stopShowLoop();
    refreshBackground(null);
    showTimer = setInterval(() => refreshBackground(null), SHOW_INTERVAL);
  }

  function stopShowLoop() {
    if (showTimer) clearInterval(showTimer);
    showTimer = null;
  }

  // ── HISTORIAL ──────────────────────────────────────────────
  function pushHistory(artist, title) {
    if (!historyList) return;
    const entry = `${artist} — ${title}`;
    if (history[0] === entry) return;
    history.unshift(entry);
    if (history.length > 5) history.pop();

    historyList.innerHTML =
      `<div class="history-title">Historial musical</div>` +
      history
        .map((t, i) => `<div class="history-item${i === 0 ? " history-now" : ""}">${t}</div>`)
        .join("");
  }

  // ── TOAST ──────────────────────────────────────────────────
  function showToast(artist, title) {
    if (!songToast || !toastSong) return;
    toastSong.textContent = `${artist} — ${title}`;
    songToast.classList.add("toast-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => songToast.classList.remove("toast-visible"), 4000);
  }

  // ── UI ─────────────────────────────────────────────────────
  function updatePlayUI(p) {
    isPlaying = p;
    if (playIcon) playIcon.textContent = p ? "❚❚" : "▶";
    player.classList.toggle("playing", p);
    if (playBtn) playBtn.setAttribute("aria-label", p ? "Pausar" : "Reproducir");
  }

  function updateMuteUI(m) {
    isMuted      = m;
    audio.muted  = m;
    if (muteIcon)   muteIcon.textContent   = m ? "🔇" : "🔊";
    if (volumeEmoji) volumeEmoji.textContent = m ? "🔇" : "🔊";
  }

  // ── METADATA ───────────────────────────────────────────────
  async function fetchMeta() {
    try {
      const res = await fetch(`${API_URL}?t=${Date.now()}`, { cache: "no-store" });
      if (!res.ok) return;

      const data = await res.json();
      if (!data?.title) return;

      const artist = data.artist || "SONAR ROCK";
      const title  = data.title  || "Transmitiendo rock";
      const meta   = `${artist}|||${title}`;

      if (meta !== lastMeta) {
        if (lastMeta) {
          const [pa, pt] = lastMeta.split("|||");
          pushHistory(pa, pt);
        }
        lastMeta = meta;
        if (trackInfo)   trackInfo.textContent   = title;
        if (trackArtist) trackArtist.textContent = artist;
        showToast(artist, title);
      }

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

  // ── PLAYER ─────────────────────────────────────────────────
  async function play() {
    try {
      setStatus("loading");

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
    audio.src = "";   // libera buffer para reconexión limpia
    stopMetaLoop();
    updatePlayUI(false);
    setStatus("paused");
  }

  function toggle() {
    isPlaying ? pause() : play();
  }

  // ── VOLUMEN ────────────────────────────────────────────────
  function toggleMute() {
    updateMuteUI(!isMuted);
  }

  function setVolume(v) {
    audio.volume = v;
    if (v > 0 && isMuted) updateMuteUI(false);
    if (v === 0)           updateMuteUI(true);
    if (volumeEmoji) volumeEmoji.textContent = v === 0 ? "🔇" : v < 0.5 ? "🔉" : "🔊";
  }

  // ── EVENTOS ────────────────────────────────────────────────
  playBtn.addEventListener("click", toggle);
  if (muteBtn) muteBtn.addEventListener("click", toggleMute);

  if (volumeCtrl) {
    volumeCtrl.addEventListener("input", e => setVolume(parseFloat(e.target.value)));
  }

  audio.addEventListener("playing", () => { if (isPlaying) setStatus("live");      });
  audio.addEventListener("waiting", () => { if (isPlaying) setStatus("buffering"); });
  audio.addEventListener("stalled", () => { if (isPlaying) setStatus("buffering"); });
  audio.addEventListener("error",   () => {
    setStatus("error");
    stopMetaLoop();
    updatePlayUI(false);
  });

  // ── INIT ───────────────────────────────────────────────────
  if (trackInfo)   trackInfo.textContent   = "Transmitiendo rock sin concesiones";
  if (trackArtist) trackArtist.textContent = "SONAR ROCK";

  setStatus("ready");
  startShowLoop();  // revisa horario de shows sin necesidad de reproducir

});
