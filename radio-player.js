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
  let reconnectTimer;
  let timerInterval;
  let seconds = 0;
  let isPlaying = false;

  audio.src = STREAM_URL;
  audio.volume = volumeSlider.value;

  function updateStatus(status) {
    statusText.textContent = status.toUpperCase();
    if(status === "REPRODUCIENDO") statusText.style.color = "#00ff88";
    else if(status === "OFFLINE") statusText.style.color = "#ff4d4d";
    else statusText.style.color = "#ffffff";
  }

  updateStatus("OFFLINE");

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

 function tryReconnect() {
  clearTimeout(reconnectTimer);
  updateStatus("OFFLINE");
  isPlaying = false;
  container.classList.remove("playing");

  reconnectTimer = setTimeout(() => {
    audio.load();
    audio.play().catch(() => {});
  }, 2000);
}


  // Play / Pause
  playBtn.addEventListener("click", () => {
    if (!isPlaying) { 
      audio.play().then(() => {
       const discoAudio = document.getElementById("disco-audio");
if (discoAudio && !discoAudio.paused) {
  discoAudio.pause();
}
      
        playBtn.innerHTML = '<i class="fas fa-pause"></i>';
        updateStatus("REPRODUCIENDO");
        container.classList.add("playing");
        isPlaying = true;
        startTimer();
      }).catch(err => console.log("Play bloqueado:", err));
    } else {
      audio.pause();
      playBtn.innerHTML = '<i class="fas fa-play"></i>';
      updateStatus("OFFLINE");
      container.classList.remove("playing");
      isPlaying = false;
      stopTimer();
    }
  });

  // Stop
  stopBtn.addEventListener("click", () => {
    audio.pause();
    audio.currentTime = 0;
    playBtn.innerHTML = '<i class="fas fa-play"></i>';
    updateStatus("OFFLINE");
    container.classList.remove("playing");
    isPlaying = false;
    stopTimer();
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

  // Reconexión automática
  audio.addEventListener("error", tryReconnect);
  audio.addEventListener("stalled", tryReconnect);
  audio.addEventListener("ended", tryReconnect);
});
