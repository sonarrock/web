<script>
document.addEventListener("DOMContentLoaded", function () {
  const audio = document.getElementById("radioPlayer");
  const playBtn = document.getElementById("playBtn");
  const playIcon = document.getElementById("playIcon");
  const volumeControl = document.getElementById("volumeControl");
  const statusText = document.getElementById("statusText");
  const statusDot = document.getElementById("statusDot");
  const visualizer = document.querySelector(".visualizer");
  const shareBtn = document.getElementById("shareBtn");
  const openExternal = document.getElementById("openExternal");

  const streamURL = "https://stream.zeno.fm/ezq3fcuf5ehvv";
  const pageURL = window.location.href;

  audio.src = streamURL;
  openExternal.href = streamURL;

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
      statusText.textContent = "Toca reproducir de nuevo";
    }
  });

  audio.addEventListener("playing", () => {
    isPlaying = true;
    setPlayingUI(true);
  });

  audio.addEventListener("pause", () => {
    isPlaying = false;
    setPlayingUI(false);
  });

  audio.addEventListener("waiting", () => {
    statusText.textContent = "Conectando al stream...";
  });

  audio.addEventListener("error", () => {
    statusText.textContent = "No se pudo conectar al stream";
    statusDot.classList.remove("live");
    visualizer.classList.remove("playing");
    playIcon.textContent = "▶";
    isPlaying = false;
  });

  volumeControl.addEventListener("input", function () {
    audio.volume = this.value;
  });

  shareBtn.addEventListener("click", async function () {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Sonar Rock",
          text: "Escucha Sonar Rock en vivo",
          url: pageURL
        });
      } catch (err) {
        console.log("Compartir cancelado");
      }
    } else {
      navigator.clipboard.writeText(pageURL);
      statusText.textContent = "Enlace copiado al portapapeles";
      setTimeout(() => {
        statusText.textContent = isPlaying
          ? "Reproduciendo Sonar Rock en vivo"
          : "Listo para reproducir";
      }, 2500);
    }
  });
});
</script>
