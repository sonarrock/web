document.addEventListener("DOMContentLoaded", () => {
  const audio = document.getElementById("radio-audio");
  const playBtn = document.getElementById("playPauseBtn");
  const stopBtn = document.getElementById("stop-btn");
  const muteBtn = document.getElementById("mute-btn");
  const volume = document.getElementById("volume");

  // URL del streaming
  audio.src = "https://stream.zeno.fm/ezq3fcuf5ehvv";
  audio.volume = 1;

  playBtn.onclick = () => {
    audio.play().catch(e => console.log("Play bloqueado por navegador:", e));
    playBtn.innerHTML = '<i class="fas fa-pause"></i>';
  };

  stopBtn.onclick = () => {
    audio.pause();
    audio.currentTime = 0;
    playBtn.innerHTML = '<i class="fas fa-play"></i>';
  };

  muteBtn.onclick = () => {
    audio.muted = !audio.muted;
    muteBtn.innerHTML = audio.muted
      ? '<i class="fas fa-volume-mute"></i>'
      : '<i class="fas fa-volume-up"></i>';
  };

  volume.oninput = e => audio.volume = e.target.value;
});
