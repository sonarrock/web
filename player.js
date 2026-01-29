document.addEventListener("DOMContentLoaded", () => {

  const audio = document.getElementById("radio-audio");
  const playBtn = document.getElementById("playPauseBtn");

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  const STREAM_URL = isIOS
    ? "https://node-01.zeno.fm/ezq3fcuf5ehvv"
    : "https://stream.zeno.fm/ezq3fcuf5ehvv";

  let isPlaying = false;

  playBtn.addEventListener("click", () => {

    if (!isPlaying) {
      audio.src = STREAM_URL;
      audio.load();

      setTimeout(() => {
        audio.play().then(() => {
          isPlaying = true;
          playBtn.innerHTML = '<i class="fas fa-pause"></i>';
        }).catch(err => {
          console.error("iOS bloqueó el audio:", err);
        });
      }, 300);

    } else {
      audio.pause();
      isPlaying = false;
      playBtn.innerHTML = '<i class="fas fa-play"></i>';
    }

  });

});
