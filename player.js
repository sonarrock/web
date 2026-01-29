document.addEventListener("DOMContentLoaded", () => {
  const audio = document.getElementById("radio-audio");
  const playBtn = document.getElementById("playPauseBtn");
  const stopBtn = document.getElementById("stop-btn");
  const muteBtn = document.getElementById("mute-btn");
  const volumeSlider = document.getElementById("volume");
  const statusText = document.getElementById("status-text");

  const STREAM_URL = "https://stream.zeno.fm/ezq3fcuf5ehvv";
  let reconnectTimer;

  audio.src = STREAM_URL;
  audio.volume = volumeSlider.value;

  function updateStatus(status) {
    statusText.textContent = status.toUpperCase();
    if(status === "reproduciendo") statusText.style.color = "#00ff88";
    else if(status === "offline") statusText.style.color = "#ff4d4d";
    else statusText.style.color = "#ffffff";
  }

  updateStatus("offline");

  // Reconexión automática
  function tryReconnect() {
    clearTimeout(reconnectTimer);
    updateStatus("offline");
    reconnectTimer = setTimeout(() => {
      audio.load();
      audio.play().catch(() => {}); // autoplay bloqueado
    }, 5000);
  }

  // Eventos de audio
  audio.addEventListener("playing", () => updateStatus("reproduciendo"));
  audio.addEventListener("pause", () => updateStatus("offline"));
  audio.addEventListener("error", tryReconnect);
  audio.addEventListener("stalled", tryReconnect);
  audio.addEventListener("ended", tryReconnect);
  audio.addEventListener("canplay", () => console.log("Stream listo para reproducir"));

  // Play / Pause
  playBtn.addEventListener("click", () => {
    audio.load(); // fuerza carga del stream
    audio.play().then(() => {
      playBtn.innerHTML = '<i class="fas fa-pause"></i>';
    }).catch(err => {
      console.log("Play bloqueado por navegador", err);
      alert("Haz click en Play para iniciar el streaming");
    });
  });

  // Stop
  stopBtn.addEventListener("click", () => {
    audio.pause();
    audio.currentTime = 0;
    playBtn.innerHTML = '<i class="fas fa-play"></i>';
    updateStatus("offline");
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
