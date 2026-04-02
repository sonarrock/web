document.addEventListener("DOMContentLoaded", function () {
  const audio = document.getElementById("radioPlayer");
  const playBtn = document.getElementById("playBtn");
  const playIcon = document.getElementById("playIcon");
  const volumeControl = document.getElementById("volumeControl");
  const statusText = document.getElementById("statusText");
  const statusDot = document.getElementById("statusDot");
  const visualizer = document.querySelector(".visualizer");

  let isPlaying = false;

  function setPlayingUI(playing) {
    if (playing) {
      playIcon.textContent = "❚❚";
      statusText.textContent = "Reproduciendo Sonar Rock en vivo";
      statusDot.classList.add("live");
      visualizer.classList.add("playing");
    } else {
      playIcon.textContent = "▶";
      statusText.textContent = "Listo para reproducir";
      statusDot.classList.remove("live");
      visualizer.classList.remove("playing");
    }
  }

  playBtn.addEventListener("click", async function () {
    try {
      if (!isPlaying) {
        await audio.play();
        isPlaying = true;
        setPlayingUI(true);
      } else {
        audio.pause();
        isPlaying = false;
        setPlayingUI(false);
      }
    } catch (error) {
      console.error("Error al reproducir:", error);
    }
  });

  volumeControl.addEventListener("input", function () {
    audio.volume = this.value;
  });
});
