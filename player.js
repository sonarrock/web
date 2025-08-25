const audio = document.getElementById('cancion');
const playBtn = document.getElementById('play-btn');
const pauseBtn = document.getElementById('pause-btn');
const muteBtn = document.getElementById('mute-btn');

playBtn.addEventListener('click', () => {
  audio.play().catch(e => console.error('Error al reproducir:', e));
});

pauseBtn.addEventListener('click', () => {
  audio.pause();
});

muteBtn.addEventListener('click', () => {
  audio.muted = !audio.muted;
});

resizeCanvas();
