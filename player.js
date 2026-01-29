document.addEventListener("DOMContentLoaded", () => {

  const audio = document.getElementById("radio-audio");
  const playBtn = document.getElementById("playPauseBtn");

  console.log("JS CARGADO", audio, playBtn);

  const STREAM_URL = "https://stream.zeno.fm/ezq3fcuf5ehvv";

  playBtn.addEventListener("click", () => {
    console.log("CLICK PLAY");
    audio.src = STREAM_URL;
    audio.play().catch(err => console.error(err));
  });

});
