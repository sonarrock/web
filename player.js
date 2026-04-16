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
  // DETECCIÓN DE DISPOSITIVO
  // =========================
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  // =========================
  // CONFIG
  // =========================
  const STREAM_URL = "https://giss.tv:667/sonarrock.mp3";
  const METADATA_URL = "https://giss.tv:667/status-json.xsl";

  const DEFAULT_TRACK_TEXT = "Transmitiendo rock sin concesiones";
  const DEFAULT_ARTIST_TEXT = "Señal lista";

  const maxReconnectAttempts = 6;
  const reconnectDelay = 4000;

  let isPlaying = false;
  let reconnectTimer = null;
  let reconnectAttempts = 0;
  let isUserPaused = false;

  // =========================
  // AUDIO SETUP
  // =========================
  audio.preload = "none";
  audio.setAttribute("playsinline", "");
  audio.setAttribute("webkit-playsinline", "");
  audio.playsInline = true;

  // =========================
  // UI
  // =========================
  function setStatus(text, live = false) {
    if (statusText) statusText.textContent = text;
    if (miniStatus) miniStatus.textContent = text;
    if (statusDot) statusDot.classList.toggle("live", live);
    if (miniLiveDot) miniLiveDot.classList.toggle("live", live);
  }

  function updatePlayUI(playing) {
    isPlaying = playing;
    if (playIcon) playIcon.textContent = playing ? "❚❚" : "▶";
    if (miniPlayIcon) miniPlayIcon.textContent = playing ? "❚❚" : "▶";
  }

  function clearReconnect() {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  }

  // =========================
  // PLAY CORREGIDO (CLAVE)
  // =========================
  async function playStream() {
    try {
      clearReconnect();
      reconnectAttempts = 0;
      isUserPaused = false;

      setStatus("Conectando...", false);

      audio.crossOrigin = "anonymous";
      audio.src = `${STREAM_URL}?t=${Date.now()}`;
      audio.load();

      // 🔥 PRIMERO reproducir (FIX iOS)
      await audio.play();

      updatePlayUI(true);
      setStatus("Transmitiendo en vivo", true);

      // 🔥 SOLO EN PC activar VU
      if (!isMobile) {
        initAudioGraph();
      }

    } catch (e) {
      console.error("Error:", e);
      updatePlayUI(false);
      setStatus("Toca reproducir nuevamente", false);
    }
  }

  function pauseStream() {
    clearReconnect();
    isUserPaused = true;
    audio.pause();
    updatePlayUI(false);
  }

  function togglePlay() {
    isPlaying ? pauseStream() : playStream();
  }

  // =========================
  // BOTONES
  // =========================
  playBtn.addEventListener("click", togglePlay);
  miniPlayBtn?.addEventListener("click", togglePlay);

  // =========================
  // EVENTOS AUDIO
  // =========================
  audio.addEventListener("playing", () => {
    updatePlayUI(true);
    setStatus("Transmitiendo en vivo", true);
  });

  audio.addEventListener("waiting", () => {
    if (!isPlaying) return;
    setStatus("Bufferizando...", false);
  });

  audio.addEventListener("error", () => {
    setStatus("Error en la señal", false);
    recoverPlayback();
  });

  function recoverPlayback() {
    if (reconnectAttempts >= maxReconnectAttempts) return;

    reconnectAttempts++;
    setStatus("Reconectando...", false);

    reconnectTimer = setTimeout(() => {
      playStream();
    }, reconnectDelay);
  }

  // =========================
  // VU METER SOLO PC
  // =========================
  let audioContext, analyser, source;

  function initAudioGraph() {
    if (isMobile) return;

    try {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      analyser = audioContext.createAnalyser();

      source = audioContext.createMediaElementSource(audio);
      source.connect(analyser);
      analyser.connect(audioContext.destination);

    } catch (e) {
      console.warn("WebAudio desactivado:", e);
    }
  }

  // =========================
  // INIT
  // =========================
  updatePlayUI(false);
});
