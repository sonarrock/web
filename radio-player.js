document.addEventListener("DOMContentLoaded", () => {
  const audio = document.getElementById("radio-audio");
  const playBtn = document.getElementById("playPauseBtn");
  const stopBtn = document.getElementById("stop-btn");
  const muteBtn = document.getElementById("mute-btn");
  const volumeSlider = document.getElementById("volume");
  const statusText = document.getElementById("status-text");
  const timerEl = document.getElementById("timer");
  const container = document.querySelector(".player-container");

  const STREAM_URL = "https://stream.zeno.fm/ezq3fcuf5ehvv";
  const MAX_RECONNECT_ATTEMPTS = 6;

  let timerInterval;
  let reconnectTimer;
  let reconnectAttempts = 0;
  let seconds = 0;
  let isPlaying = false;
  let streamInitialized = false;
  let userMuted = localStorage.getItem("radioMuted") === "true";

  /* =========================
     CONFIGURACIÓN INICIAL
  ========================== */
  audio.preload = "auto";
  audio.crossOrigin = "anonymous";
  audio.volume = parseFloat(localStorage.getItem("radioVolume")) || 1;
  volumeSlider.value = audio.volume;
  audio.muted = userMuted;
  muteBtn.innerHTML = audio.muted
    ? '<i class="fas fa-volume-mute"></i>'
    : '<i class="fas fa-volume-up"></i>';

  (function precacheStream() {
    if (!streamInitialized) {
      audio.src = STREAM_URL;
      audio.load();
      streamInitialized = true;
    }
  })();

  /* =========================
     FUNCIONES UI / STATUS
  ========================== */
  function updateStatus(status) {
    statusText.textContent = status.toUpperCase();
    switch(status) {
      case "REPRODUCIENDO": statusText.style.color="#00ff88"; break;
      case "OFFLINE": statusText.style.color="#ff4d4d"; break;
      case "CARGANDO": statusText.style.color="#ffd166"; break;
      case "REINTENTANDO": statusText.style.color="#ffbb33"; break;
      case "ERROR": statusText.style.color="#ff5555"; break;
      default: statusText.style.color="#ffffff"; break;
    }
  }

  updateStatus("OFFLINE");

  /* =========================
     TIMER
  ========================== */
  function startTimer() {
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      seconds++;
      const m = String(Math.floor(seconds / 60)).padStart(2,"0");
      const s = String(seconds % 60).padStart(2,"0");
      timerEl.textContent = `${m}:${s}`;
    },1000);
  }

  function stopTimer() {
    clearInterval(timerInterval);
    seconds = 0;
    timerEl.textContent = "00:00";
  }

  /* =========================
     RECONEXIÓN SILENCIOSA
  ========================== */
  function tryReconnect() {
    clearTimeout(reconnectTimer);
    if(reconnectAttempts >= MAX_RECONNECT_ATTEMPTS){
      updateStatus("ERROR");
      playBtn.classList.remove("loading");
      playBtn.innerHTML = '<i class="fas fa-play"></i>';
      return;
    }

    reconnectAttempts++;
    updateStatus("REINTENTANDO");
    playBtn.classList.add("loading");
    playBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    container.classList.remove("playing");
    isPlaying = false;

    const delay = Math.min(3000 * reconnectAttempts, 15000); // backoff: 3s, 6s, ... max 15s
    reconnectTimer = setTimeout(() => {
      audio.load();
      audio.play().catch(() => tryReconnect());
    }, delay);
  }

  /* =========================
     EVENTOS DE AUDIO
  ========================== */
  audio.addEventListener("waiting", () => updateStatus("CARGANDO"));
  audio.addEventListener("playing", () => {
    updateStatus("REPRODUCIENDO");
    playBtn.classList.remove("loading");
    playBtn.innerHTML = '<i class="fas fa-pause"></i>';
    container.classList.add("playing");
    isPlaying = true;
    reconnectAttempts = 0;
    startTimer();
    if(!userMuted && audio.muted) setTimeout(()=>{audio.muted=false},800);
  });
  audio.addEventListener("pause", ()=>{if(!audio.ended) updateStatus("OFFLINE");});
  audio.addEventListener("error", tryReconnect);
  audio.addEventListener("stalled", tryReconnect);
  audio.addEventListener("ended", tryReconnect);
  audio.addEventListener("canplaythrough", ()=>{if(!isPlaying) audio.play().catch(()=>{});});

  /* =========================
     CONTROLES
  ========================== */
  playBtn.addEventListener("click", ()=>{
    if(!isPlaying){
      if(!streamInitialized){
        audio.src = STREAM_URL + "?t=" + Date.now();
        audio.load();
        streamInitialized = true;
      }

      const wasMuted = audio.muted;
      if(!wasMuted) audio.muted = true;
      updateStatus("CARGANDO");
      playBtn.classList.add("loading");
      playBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

      audio.play().then(()=>{
        if(!userMuted && audio.muted) setTimeout(()=>{audio.muted=false},800);
      }).catch(err=>{
        console.warn("Play bloqueado:", err);
        audio.muted = wasMuted;
        playBtn.classList.remove("loading");
        playBtn.innerHTML = '<i class="fas fa-play"></i>';
      });
    } else {
      audio.pause();
      isPlaying=false;
      stopTimer();
      playBtn.classList.remove("loading");
      playBtn.innerHTML = '<i class="fas fa-play"></i>';
      container.classList.remove("playing");
      updateStatus("OFFLINE");
    }
  });

  stopBtn.addEventListener("click", ()=>{
    audio.pause();
    audio.removeAttribute("src");
    audio.load();
    streamInitialized=false;
    playBtn.classList.remove("loading");
    playBtn.innerHTML='<i class="fas fa-play"></i>';
    updateStatus("OFFLINE");
    container.classList.remove("playing");
    isPlaying=false;
    stopTimer();
    reconnectAttempts = 0;
  });

  muteBtn.addEventListener("click", ()=>{
    audio.muted = !audio.muted;
    userMuted = audio.muted;
    localStorage.setItem("radioMuted", userMuted);
    muteBtn.innerHTML = audio.muted
      ? '<i class="fas fa-volume-mute"></i>'
      : '<i class="fas fa-volume-up"></i>';
  });

  volumeSlider.addEventListener("input", e=>{
    audio.volume = e.target.value;
    localStorage.setItem("radioVolume", e.target.value);
  });

  /* =========================
     VISIBILIDAD (BACKGROUND)
  ========================== */
  document.addEventListener("visibilitychange", ()=>{
    if(document.visibilityState==="hidden" && isPlaying){
      audio.play().catch(()=>{});
    }
  });
});
