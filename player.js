document.addEventListener("DOMContentLoaded", () => {

  const audio = document.getElementById("radio-audio");
  const playBtn = document.getElementById("playPauseBtn");

  if (!audio || !playBtn) {
    console.error("Player no inicializado");
    return;
  }

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  const STREAM_URL = isIOS
    ? "https://node-01.zeno.fm/ezq3fcuf5ehvv"
    : "https://stream.zeno.fm/ezq3fcuf5ehvv";

  let isPlaying = false;

  playBtn.addEventListener("click", () => {

    if (!isPlaying) {

      audio.src = STREAM_URL;
      audio.load();

      audio.play().then(() => {
        isPlaying = true;
        playBtn.innerHTML = '<i class="fas fa-pause"></i>';
      }).catch(err => {
        console.error("Error reproducción:", err);
      });

    } else {
      audio.pause();
      isPlaying = false;
      playBtn.innerHTML = '<i class="fas fa-play"></i>';
    }

  });

});
