const audio = document.getElementById("cancion"); // tu <audio hidden>
const playBtn = document.getElementById("play-btn");
const pauseBtn = document.getElementById("pause-btn");
const muteBtn = document.getElementById("mute-btn");

// Play
playBtn.addEventListener("click", () => {
  audio.play();
});

// Pause
pauseBtn.addEventListener("click", () => {
  audio.pause();
});

// Mute / Unmute
muteBtn.addEventListener("click", () => {
  audio.muted = !audio.muted;
  // Cambia el ícono dinámicamente (si quieres que se actualice)
  muteBtn.innerHTML = audio.muted
    ? `<i class="bi bi-volume-up-fill"></i>`
    : `<i class="bi bi-volume-mute-fill"></i>`;
});
