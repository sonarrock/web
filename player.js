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
  let lastUpdated = 0; // 🔥 CAMBIO CLAVE
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
    if (statusText) statusText.textContent =
