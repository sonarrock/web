document.addEventListener("DOMContentLoaded", () => {
  const audio = document.getElementById("radio-audio");
  const playBtn = document.getElementById("playPauseBtn");
  const stopBtn = document.getElementById("stop-btn");
  const muteBtn = document.getElementById("mute-btn");
  const volumeSlider = document.getElementById("volume");
  const statusText = document.getElementById("status-text");
  const timerEl = document.getElementById("timer");

  const STREAM_URL = "https://stream.zeno.fm/ezq3fcuf5ehvv";
  let reconnectTimer;
  let timerInterval;
  let seconds = 0;

  audio.src = STREAM_URL;
  audio.volume = volumeSlider.value;

  function updateStatus(status) {
    statusText.textContent = status.toUpperCase();
    if (status === "REPRODUCIENDO") statusText.style.color = "#00ff88";
    else if (status === "OFFLINE") statusText.style.color = "#ff4d4d";
    else statusText.style.color = "#ffffff";
  }

  updateStatus("OFFLINE");

  function tryReconnect() {
    clearTimeout(reconnectTimer);
    updateStatus("OFFLINE");
    reconnectTimer = setTimeout(() => {
      audio.load();
      audio.play().catch(() => {});
    }, 5000);
  }

  // Actualiza contador
  function startTimer() {
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      seconds++;
      const m = String(Math.floor(seconds / 60)).padStart(2, "0");
      const s = String(seconds % 60).padStart(2, "0");
      timerEl.textContent = `${m}:${s}`;
    }, 1000);
  }

  function stopTimer() {
    clearInterval(timerInterval);
    seconds = 0;
    timerEl.textContent = "00:00";
  }

  // Eventos de audio
  audio.addEventListener("playing", () => updateStatus("REPRODUCIENDO"));
  audio.addEventListener("pause", () => updateStatus("OFFLINE"));
  audio.addEventListener("error", tryReconnect);
  audio.addEventListener("stalled", tryReconnect);
  audio.addEventListener("ended", tryReconnect);

  // Play / Pause
  playBtn.addEventListener("click", () => {
    if (audio.paused) {
      audio.load();
      audio.play().then(() => {
        playBtn.innerHTML = '<i class="fas fa-pause"></i>';
        updateStatus("REPRODUCIENDO");
        startTimer();
        document.querySelector(".player-container").classList.add("playing");
      }).catch(err => console.log("Play bloqueado:", err));
    } else {
      audio.pause();
      playBtn.innerHTML = '<i class="fas fa-play"></i>';
      stopTimer();
      document.querySelector(".player-container").classList.remove("playing");
    }
  });

  // Stop
  stopBtn.addEventListener("click", () => {
    audio.pause();
    audio.currentTime = 0;
    playBtn.innerHTML = '<i class="fas fa-play"></i>';
    stopTimer();
    updateStatus("OFFLINE");
    document.querySelector(".player-container").classList.remove("playing");
  });

  // Mute
  muteBtn.addEventListener("click", () => {
    audio.muted = !audio.muted;
    muteBtn.innerHTML = audio.muted
      ? '<i class="fas fa-volume-mute"></i>'
      : '<i class="fas fa-volume-up"></i>';
  });

  // Volumen
  volumeSlider.addEventListener("input", e => audio.volume = e.target.value);
});
