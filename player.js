const audio = document.getElementById("audio");
const playBtn = document.getElementById("play-btn");
const pauseBtn = document.getElementById("pause-btn");
const stopBtn = document.getElementById("stop-btn");
const muteBtn = document.getElementById("mute-btn");
const progress = document.getElementById("progress");
const timeDisplay = document.getElementById("time-display");
const matrix = document.getElementById("matrix");
let matrixInterval;

// CONTROLES
playBtn.addEventListener("click", () => {
  audio.play();
  runMatrix();
});
pauseBtn.addEventListener("click", () => {
  audio.pause();
  stopMatrix();
});
stopBtn.addEventListener("click", () => {
  audio.pause();
  audio.currentTime = 0;
  stopMatrix();
});
muteBtn.addEventListener("click", () => {
  audio.muted = !audio.muted;
  muteBtn.classList.toggle("active");
});

//

}
