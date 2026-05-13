document.addEventListener("DOMContentLoaded", () => {

  const audio = document.getElementById("radioPlayer");
  const playBtn = document.getElementById("playBtn");
  const playIcon = document.getElementById("playIcon");
  const miniPlayBtn = document.getElementById("miniPlayBtn");
  const miniPlayIcon = document.getElementById("miniPlayIcon");

  const trackInfo = document.getElementById("trackInfo");
  const trackArtist = document.getElementById("trackArtist");
  const stationCover = document.getElementById("stationCover");
  const statusText = document.getElementById("statusText");

  if (!audio || !playBtn) return;

  const STREAM_URL = "https://giss.tv:667/sonarrock.mp3";
  const API_URL = "https://sonarrock-api.cmrm1982.workers.dev/";

  const DEFAULT_ARTIST = "SONAR ROCK";
  const DEFAULT_TITLE = "Transmitiendo rock sin concesiones";
  const DEFAULT_COVER = "/attached_assets/logo_1749601460841.jpeg";

  let isPlaying = false;
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
  function updateUI(playing) {
    isPlaying = playing;
    if (playIcon) playIcon.textContent = playing ? "❚❚" : "▶";
    if (miniPlayIcon) miniPlayIcon.textContent = playing ? "❚❚" : "▶";
  }

  function updateText(title, artist) {
    if (trackInfo) trackInfo.textContent = title;
    if (trackArtist) trackArtist.textContent = artist;
  }

  function setCover(url) {
    if (!stationCover) return;

    const img = new Image();
    img.onload = () => {
      stationCover.src = url;
    };
    img.onerror = () => {
      stationCover.src = DEFAULT_COVER;
    };
    img.src = url;
  }

  // ================= METADATA =================
  async function fetchMeta() {
    try {
      const res = await fetch(API_URL + "?t=" + Date.now(), {
        cache: "no-store"
      });

      const data = await res.json();
      if (!data?.title) return;

      const artist = data.artist || DEFAULT_ARTIST;
      const title = data.title || DEFAULT_TITLE;

      const key = artist + "-" + title;
      if (key === lastKey) return;
      lastKey = key;

      updateText(title, artist);

      const cover = data.cover || DEFAULT_COVER;
      setCover(cover);

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

      updateUI(true);
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
    updateUI(false);
    setStatus("paused");
  }

  function toggle() {
    isPlaying ? pause() : play();
  }

  playBtn.addEventListener("click", toggle);
  if (miniPlayBtn) miniPlayBtn.addEventListener("click", toggle);

  audio.addEventListener("playing", () => setStatus("live"));
  audio.addEventListener("error", () => {
    setStatus("error");
    updateUI(false);
    stopLoop();
  });

  updateText(DEFAULT_TITLE, DEFAULT_ARTIST);
  setCover(DEFAULT_COVER);
  setStatus("ready");

});
