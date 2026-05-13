
document.addEventListener("DOMContentLoaded", () => {

  const audio = document.getElementById("radioPlayer");
  const playBtn = document.getElementById("playBtn");
  const playIcon = document.getElementById("playIcon");

  const muteBtn = document.getElementById("muteBtn");
  const muteIcon = document.getElementById("muteIcon");

  const volume = document.getElementById("volumeControl");

  const trackInfo = document.getElementById("trackInfo");
  const trackArtist = document.getElementById("trackArtist");
  const stationCover = document.getElementById("stationCover");
  const statusText = document.getElementById("statusText");

  const player = document.querySelector(".sonar-player");

  if (!audio || !playBtn) return;

  const STREAM_URL = "https://giss.tv:667/sonarrock.mp3";
  const API_URL = "https://sonarrock-api.cmrm1982.workers.dev/";

  const DEFAULT_COVER = "/attached_assets/logo_1749601460841.jpeg";

  let isPlaying = false;
  let isMuted = false;
  let lastKey = "";
  let timer = null;

  // ================= STATUS =================
  function setStatus(s) {
    const map = {
      loading: "Conectando...",
      live: "En vivo",
      buffering: "Buffer...",
      paused: "Pausado",
      error: "Sin señal",
      ready: "Listo"
    };
    if (statusText) statusText.textContent = map[s] || s;
  }

  // ================= UI =================
  function updatePlayUI(p) {
    isPlaying = p;
    playIcon.textContent = p ? "❚❚" : "▶";
  }

  function updateMuteUI(m) {
    muteIcon.textContent = m ? "🔇" : "🔊";
  }

  // ================= LIMPIEZA TEXTO =================
  function cleanText(text = "") {
    try { text = decodeURIComponent(text); } catch {}
    return text.replace(/\+/g, " ").replace(/\s+/g, " ").trim();
  }

  // ================= COVER + BACKGROUND =================
  function setVisual(cover) {
    const img = new Image();

    img.onload = () => {
      const url = cover + "?v=" + Date.now();

      stationCover.src = url;
      player.style.setProperty("--dynamic-bg", `url('${url}')`);
    };

    img.onerror = () => {
      stationCover.src = DEFAULT_COVER;
      player.style.setProperty("--dynamic-bg", `url('${DEFAULT_COVER}')`);
    };

    img.src = cover;
  }

  // ================= SHOW BACKGROUNDS =================
  function getShowBackground() {
    const d = new Date();
    const day = d.getDay();
    const hour = d.getHours();

    // Miércoles 9pm–12am
    if (day === 3 && hour >= 21) {
      return "/attached_assets/session.jpg";
    }

    // Jueves 9pm–12am
    if (day === 4 && hour >= 21) {
      return "/attached_assets/ladoB.jpg";
    }

    return DEFAULT_COVER;
  }

  // ================= METADATA =================
  async function fetchMeta() {
    try {
      const res = await fetch(API_URL + "?t=" + Date.now(), {
        cache: "no-store"
      });

      if (!res.ok) return;

      const data = await res.json();
      if (!data?.title) return;

      const artist = cleanText(data.artist || "SONAR ROCK");
      const title = cleanText(data.title || "Transmitiendo rock sin concesiones");

      const key = artist + " - " + title;
      if (key === lastKey) return;
      lastKey = key;

      trackInfo.textContent = title;
      trackArtist.textContent = artist;

      // 🔥 USAR FONDO LOCAL SIEMPRE (ESTABLE)
      const bg = getShowBackground();
      setVisual(bg);

      console.log("🎵 NOW:", key);

    } catch (e) {
      console.warn("metadata error", e);
    }
  }

  function startLoop() {
    stopLoop();
    fetchMeta();
    timer = setInterval(fetchMeta, 5000);
  }

  function stopLoop() {
    if (timer) clearInterval(timer);
    timer = null;
  }

  // ================= PLAYER =================
  async function play() {
    try {
      setStatus("loading");

      audio.src = STREAM_URL + "?t=" + Date.now();
      await audio.play();

      updatePlayUI(true);
      setStatus("live");
      startLoop();

    } catch (e) {
      console.warn(e);
      setStatus("error");
    }
  }

  function pause() {
    audio.pause();
    audio.src = "";
    stopLoop();
    updatePlayUI(false);
    setStatus("paused");
  }

  function toggle() {
    isPlaying ? pause() : play();
  }

  // ================= MUTE =================
  function toggleMute() {
    isMuted = !isMuted;
    audio.muted = isMuted;
    updateMuteUI(isMuted);
  }

  function setVolume(v) {
    audio.volume = v;
  }

  // ================= EVENTS =================
  playBtn.addEventListener("click", toggle);
  muteBtn.addEventListener("click", toggleMute);

  if (volume) {
    volume.addEventListener("input", (e) => {
      setVolume(e.target.value);
    });
  }

  audio.addEventListener("playing", () => setStatus("live"));
  audio.addEventListener("error", () => {
    setStatus("error");
    stopLoop();
  });

  // ================= INIT =================
  trackInfo.textContent = "Transmitiendo rock sin concesiones";
  trackArtist.textContent = "SONAR ROCK";

  setVisual(DEFAULT_COVER);
  setStatus("ready");

});
