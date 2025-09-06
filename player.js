const audio = document.getElementById("audio");
const playPauseBtn = document.getElementById("playPauseBtn");
const stopBtn = document.getElementById("stop-btn");
const muteBtn = document.getElementById("mute-btn");
const progress = document.getElementById("progress");
const timeDisplay = document.getElementById("time-display");
const nowPlaying = document.getElementById("now-playing");

// Play/Pause
playPauseBtn.addEventListener("click", () => {
  if(audio.paused){
    audio.play();
    playPauseBtn.innerHTML='<i class="fas fa-pause"></i>';
  } else {
    audio.pause();
    playPauseBtn.innerHTML='<i class="fas fa-play"></i>';
  }
});

// Stop
stopBtn.addEventListener("click", () => {
  audio.pause();
  audio.currentTime = 0;
  playPauseBtn.innerHTML='<i class="fas fa-play"></i>';
});

// Mute
muteBtn.addEventListener("click", () => {
  audio.muted = !audio.muted;
  muteBtn.innerHTML = audio.muted ? '<i class="fas fa-volume-mute"></i>' : '<i class="fas fa-volume-up"></i>';
  muteBtn.style.color = audio.muted ? '#ff0000' : '#ff6600';
});

// Barra de progreso y contador H:M:S
audio.addEventListener("timeupdate", () => {
  if(audio.duration){
    const percent = (audio.currentTime / audio.duration) * 100;
    progress.style.width = percent + "%";
  }

  let h = Math.floor(audio.currentTime / 3600);
  let m = Math.floor((audio.currentTime % 3600) / 60);
  let s = Math.floor(audio.currentTime % 60);

  if(h<10) h="0"+h;
  if(m<10) m="0"+m;
  if(s<10) s="0"+s;
  timeDisplay.textContent = `${h}:${m}:${s}`;
});

// Muestra título si existe, sino oculta
audio.addEventListener("play",
