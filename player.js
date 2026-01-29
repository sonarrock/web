document.addEventListener("DOMContentLoaded", () => {
  const audio = document.getElementById("radio-audio");
  const playBtn = document.getElementById("playPauseBtn");
  const stopBtn = document.getElementById("stop-btn");
  const muteBtn = document.getElementById("mute-btn");
  const volume = document.getElementById("volume");

  // URL streaming Zeno
  audio.src = "https://stream.zeno.fm/ezq3fcuf5ehvv";
  audio.volume = 1;

  // Play / Pause
  playBtn.onclick = () => {
    audio.play().then(() => {
      playBtn.innerHTML = '<i class="fas fa-pause"></i>';
    }).catch(err => {
      console.log("Navegador bloqueó el play:", err);
      alert("Haz click en Play para iniciar el streaming");
    });
  };

  // Stop
  stopBtn.onclick = () => {
    audio.pause();
    audio.currentTime = 0;
    playBtn.innerHTML = '<i class="fas fa-play"></i>';
  };

  // Mute / Unmute
  muteBtn.onclick = () => {
    audio.muted = !audio.muted;
    muteBtn.innerHTML = audio.muted
      ? '<i class="fas fa-volume-mute"></i>'
      : '<i class="fas fa-volume-up"></i>';
  };

  // Volumen
  volume.oninput = e => audio.volume = e.target.value;
});
