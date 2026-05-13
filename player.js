
document.addEventListener("DOMContentLoaded", () => {

  // ================= ELEMENTOS =================
  const audio = document.getElementById("radioPlayer");
  const playBtn = document.getElementById("playBtn");
  const playIcon = document.getElementById("playIcon");

  const miniPlayBtn = document.getElementById("miniPlayBtn");
  const miniPlayIcon = document.getElementById("miniPlayIcon");

  const trackInfo = document.getElementById("trackInfo");
  const trackArtist = document.getElementById("trackArtist");
  const stationCover = document.getElementById("stationCover");
  const statusText = document.getElementById("statusText");

  const player = document.querySelector(".sonar-player");

  if (!audio || !playBtn || !player) return;

  // ================= CONFIG =================
  const STREAM_URL = "https://giss.tv:667/sonarrock.mp3";
  const API_URL = "https://sonarrock-api.cmrm1982.workers.dev/";
  const SPOTIFY_API = "https://sonarrock-spotify.cmrm1982.workers.dev/";

  const DEFAULT_TRACK = "Transmitiendo rock sin concesiones";
  const DEFAULT_ARTIST = "SONAR ROCK";
  const DEFAULT_COVER = window.location.origin + "/attached_assets/logo_1749601460841.jpeg";

  let isPlaying = false;
  let lastTitle = "";
  let metadataTimer = null;
  let userInteracted = false;

  let history = [];
  let lastAudioTime = Date.now();

  // ================= AUDIO =================
  audio.preload = "none";
  audio.setAttribute("playsinline", "");
  audio.setAttribute("webkit-playsinline", "");

  const savedVolume = localStorage.getItem("volume");
  audio.volume = savedVolume !== null ? parseFloat(savedVolume) : 1;

  audio.addEventListener("volumechange", () => {
    localStorage.setItem("volume", audio.volume);
  });

  // ================= STATUS =================
  function setStatus(state) {
    const map = {
      loading: "Conectando...",
      live: "En vivo",
      buffering: "Bufferizando...",
      paused: "Pausado",
      error: "Sin señal",
      ready: "Listo"
    };
    if (statusText) statusText.textContent = map[state] || state;
  }

  // ================= UI =================
  function updatePlayUI(playing) {
    isPlaying = playing;
    if (playIcon) playIcon.textContent = playing ? "❚❚" : "▶";
    if (miniPlayIcon) miniPlayIcon.textContent = playing ? "❚❚" : "▶";
  }

  function updateTrack(title, artist) {
    if (trackInfo) trackInfo.textContent = title;
    if (trackArtist) trackArtist.textContent = artist;
  }

  // ================= HISTORIAL =================
  function updateHistory(title, artist) {
    if (history.length === 0 || history[0].title !== title) {
      history.unshift({ title, artist });
    }
    if (history.length > 04) history.pop();
    renderHistory();
  }

  function renderHistory() {
    const container = document.getElementById("historyList");
    if (!container) return;

    container.innerHTML =
      `<div class="history-title">Historial musical</div>` +
      history.map(t =>
        `<div class="history-item">${t.artist} - ${t.title}</div>`
      ).join("");
  }

  // ================= FADE =================
  function fadeInAudio(duration = 1200) {
    const steps = 20;
    const stepTime = duration / steps;
    let currentStep = 0;

    audio.volume = 0;

    const interval = setInterval(() => {
      currentStep++;
      audio.volume = Math.min(1, currentStep / steps);
      if (currentStep >= steps) clearInterval(interval);
    }, stepTime);
  }

  // ================= 🎙️ SHOW DETECTION =================
  function getCurrentShow() {
    const now = new Date();
    const day = now.getDay();
    const hour = now.getHours();

    // miércoles 21:00 a jueves 00:00
    if ((day === 3 && hour >= 21) || (day === 4 && hour < 1)) {
      return {
        name: "Sonar Rock Sessions",
        cover: "/icons/sessions.png"
      };
    }

    // jueves 21:00 a viernes 00:00
    if ((day === 4 && hour >= 21) || (day === 5 && hour < 1)) {
      return {
        name: "Lado B",
        cover: "/icons/ladob.jpeg"
      };
    }

    return null;
  }

  // ================= 🎨 BACKGROUND =================
  function updateDynamicBackground(imageUrl) {
    player.style.setProperty("--dynamic-bg", `url('${imageUrl}')`);
  }

  // ================= COVER =================
  function setCover(url) {
    if (!stationCover) return;

    const fallback = DEFAULT_COVER;
    const clean = url ? url.replace("http://", "https://").split("?")[0] : fallback;

    const img = new Image();

    img.onload = () => {
      stationCover.src = clean + "?v=" + Date.now();
    };

    img.onerror = () => {
      stationCover.src = fallback;
    };

    img.src = clean;
  }

  // ================= TOAST =================
  function showToast(text) {
    const toast = document.getElementById("songToast");
    const span = document.getElementById("toastSong");
    if (!toast || !span) return;

    span.textContent = text;
    toast.classList.add("show");

    setTimeout(() => toast.classList.remove("show"), 3000);
  }

  // ================= METADATA =================
  async function fetchMetadata() {
    try {
      const res = await fetch(API_URL + "?t=" + Date.now(), { cache: "no-store" });
      const data = await res.json();

      if (!data?.title) return;

      const title = cleanText(data.title);
      const artist = cleanText(data.artist || DEFAULT_ARTIST);

      if (title === lastTitle) return;
      lastTitle = title;

      updateTrack(title, artist);
      updateHistory(title, artist);

      let cover = DEFAULT_COVER;

      try {
        const spotifyRes = await fetch(
          `${SPOTIFY_API}?artist=${encodeURIComponent(artist)}&title=${encodeURIComponent(title)}`
        );
        const spotifyData = await spotifyRes.json();
        if (spotifyData.cover) cover = spotifyData.cover;
      } catch {}

      setCover(cover);

      // 🔥 SHOW MODE REAL
      const show = getCurrentShow();

      if (show) {
        player.classList.add("show-live");
        updateDynamicBackground(show.cover);
      } else {
        player.classList.remove("show-live");
        updateDynamicBackground(cover);
      }

      showToast(`${artist} - ${title}`);

    } catch (e) {
      console.warn("Metadata error:", e);
    }
  }

  function cleanText(text = "") {
    try { text = decodeURIComponent(text); } catch {}
    return text.replace(/\+/g, " ").replace(/\s+/g, " ").trim();
  }

  function startMetadata() {
    stopMetadata();
    fetchMetadata();
    metadataTimer = setInterval(fetchMetadata, 6000);
  }

  function stopMetadata() {
    if (metadataTimer) clearInterval(metadataTimer);
  }

  function unlockAudio() {
    if (userInteracted) return;
    audio.src = STREAM_URL;
    audio.load();
    userInteracted = true;
  }

  async function playStream() {
    try {
      setStatus("loading");

      if (!audio.src) {
        audio.src = STREAM_URL;
        audio.load();
      }

      await audio.play();
      fadeInAudio();

      updatePlayUI(true);
      setStatus("live");
      startMetadata();

    } catch {
      setStatus("ready");
      updatePlayUI(false);
    }
  }

  function pauseStream() {
    audio.pause();
    stopMetadata();
    updatePlayUI(false);
    setStatus("paused");
  }

  function togglePlay() {
    isPlaying ? pauseStream() : playStream();
  }

  playBtn.addEventListener("click", () => {
    unlockAudio();
    togglePlay();
  });

  if (miniPlayBtn) {
    miniPlayBtn.addEventListener("click", () => {
      unlockAudio();
      togglePlay();
    });
  }

  audio.addEventListener("playing", () => setStatus("live"));
  audio.addEventListener("waiting", () => isPlaying && setStatus("buffering"));

  audio.addEventListener("timeupdate", () => {
    lastAudioTime = Date.now();
  });

  setInterval(() => {
    if (isPlaying && Date.now() - lastAudioTime > 10000) {
      audio.load();
      audio.play().catch(() => {});
    }
  }, 5000);

  audio.addEventListener("error", () => {
    setStatus("loading");
    setTimeout(() => {
      audio.load();
      audio.play().catch(() => {});
    }, 2000);
  });

  updateTrack(DEFAULT_TRACK, DEFAULT_ARTIST);
  setCover(DEFAULT_COVER);
  updatePlayUI(false);
  setStatus("ready");

});
