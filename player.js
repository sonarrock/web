document.addEventListener("DOMContentLoaded", () => {
  const audio = document.getElementById("radio-audio");
  const playBtn = document.getElementById("playPauseBtn");
  const stopBtn = document.getElementById("stop-btn");
  const muteBtn = document.getElementById("mute-btn");
  const volumeSlider = document.getElementById("volume");
  const statusText = document.getElementById("status-text");

  // URL streaming Zeno
  const STREAM_URL = "https://stream.zeno.fm/ezq3fcuf5ehvv";
  let reconnectTimeout;

  audio.src = STREAM_URL;
  audio.volume = volumeSlider.value;

  // Función actualizar estado
  function updateStatus(status) {
    statusText.textContent = status.toUpperCase();
    if(status === "reproduciendo") {
      statusText.style.color = "#00ff88";
    } else if(status === "offline") {
      statusText.style.color = "#ff4d4d";
    } else {
      statusText.style.color = "#ffffff";
    }
  }

  updateStatus("offline");

  // Reconectar en caso de error
  function tryReconnect() {
    clearTimeout(reconnectTimeout);
    updateStatus("offline");
    reconnectTimeout = setTimeout(() => {
      audio.load();
      audio.play().catch(() => {}); // ignora error por autoplay bloqueado
    }, 5000); // reintenta cada 5 segundos
  }

  audio.addEventListener("playing", () => updateStatus("reproduciendo"));
  audio.addEventListener("pause", () => updateStatus("offline"));
  audio.addEventListener("error", tryReconnect);
  audio.addEventListener("stalled", tryReconnect);
  audio.addEventListener("ended", tryReconnect);

  // Play / Pause
  playBtn.addEventListener("click", () => {
    if(audio.paused) {
      audio.play().then(() => {
        playBtn.innerHTML = '<i class="fas fa-pause"></i>';
        updateStatus("reproduciendo");
      }).catch(err => {
        console.log("Play bloqueado por navegador:", err);
        alert("Haz click en Play para iniciar el streaming");
      });
    } else {
      audio.pause();
      playBtn.innerHTML = '<i class="fas fa-play"></i>';
      updateStatus("offline");
    }
  });

  // Stop
  stopBtn.addEventListener("click", () => {
    audio.pause();
    audio.currentTime = 0;
    playBtn.innerHTML = '<i class="fas fa-play"></i>';
    updateStatus("offline");
  });

  // Mute / Unmute
  muteBtn.addEventListener("click", () => {
    audio.muted = !audio.muted;
    muteBtn.innerHTML = audio.muted
      ? '<i class="fas fa-volume-mute"></i>'
      : '<i class="fas fa-volume-up"></i>';
  });

  // Volumen
  volumeSlider.addEventListener("input", e => audio.volume = e.target.value);
});
