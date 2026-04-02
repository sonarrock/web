document.addEventListener("DOMContentLoaded", () => {
  const audio = document.getElementById("radioPlayer");
  const playBtn = document.getElementById("playBtn");
  const playIcon = document.getElementById("playIcon");
  const muteBtn = document.getElementById("muteBtn");
  const shareBtn = document.getElementById("shareBtn");
  const popupBtn = document.getElementById("popupBtn");
  const volumeControl = document.getElementById("volumeControl");
  const statusText = document.getElementById("statusText");
  const statusDot = document.getElementById("statusDot");
  const visualizer = document.getElementById("visualizer");

  if (!audio || !playBtn) return;

  const STREAM_URL = "https://stream.zeno.fm/ezq3fcuf5ehvv";
  const SITE_URL = window.location.href;

  // =========================
  // VOLUMEN GUARDADO
  // =========================
  const savedVolume = localStorage.getItem("sonarVolume");
  if (savedVolume !== null) {
    audio.volume = parseFloat(savedVolume);
    if (volumeControl) volumeControl.value = savedVolume;
  } else {
    audio.volume = 1;
  }

  // =========================
  // PLAY / PAUSE
  // =========================
  playBtn.addEventListener("click", async () => {
    try {
      if (audio.paused) {
        updateStatus("Conectando al stream...", "loading");

        if (!audio.src) {
          audio.src = STREAM_URL;
        }

        await audio.play();
      } else {
        audio.pause();
      }
    } catch (error) {
      console.error("Error al reproducir:", error);
      updateStatus("No se pudo reproducir", "error");
    }
  });

  // =========================
  // EVENTOS AUDIO
  // =========================
  audio.addEventListener("play", () => {
    playIcon.textContent = "❚❚";
    updateStatus("Transmitiendo en vivo", "live");
    visualizer?.classList.add("playing");
  });

  audio.addEventListener("pause", () => {
    playIcon.textContent = "▶";
    updateStatus("Pausado", "");
    visualizer?.classList.remove("playing");
  });

  audio.addEventListener("waiting", () => {
    updateStatus("Cargando señal...", "loading");
  });

  audio.addEventListener("stalled", () => {
    updateStatus("Reconectando...", "loading");
  });

  audio.addEventListener("error", () => {
    updateStatus("Error de conexión", "error");
    visualizer?.classList.remove("playing");
  });

  // =========================
  // VOLUMEN
  // =========================
  if (volumeControl) {
    volumeControl.addEventListener("input", () => {
      audio.volume = parseFloat(volumeControl.value);
      localStorage.setItem("sonarVolume", volumeControl.value);

      if (audio.volume === 0) {
        audio.muted = true;
        muteBtn.textContent = "🔇";
      } else {
        audio.muted = false;
        muteBtn.textContent = "🔊";
      }
    });
  }

  // =========================
  // MUTE
  // =========================
  if (muteBtn) {
    muteBtn.addEventListener("click", () => {
      audio.muted = !audio.muted;
      muteBtn.textContent = audio.muted ? "🔇" : "🔊";
    });
  }

  // =========================
  // SHARE
  // =========================
  if (shareBtn) {
    shareBtn.addEventListener("click", async () => {
      const shareData = {
        title: "Sonar Rock - La Radio Independiente",
        text: "Escucha Sonar Rock en vivo 🔥",
        url: SITE_URL
      };

      try {
        if (navigator.share) {
          await navigator.share(shareData);
        } else {
          await navigator.clipboard.writeText(SITE_URL);
          alert("Enlace copiado al portapapeles");
        }
      } catch (error) {
        console.warn("Compartir cancelado:", error);
      }
    });
  }

  // =========================
  // POPUP PLAYER
  // =========================
  if (popupBtn) {
    popupBtn.addEventListener("click", () => {
      const popup = window.open("", "SonarRockPlayer", "width=420,height=720");

      if (!popup) return;

      popup.document.write(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Sonar Rock Player</title>
          <style>
            body {
              margin: 0;
              font-family: Inter, sans-serif;
              background: #0b0b0c;
              color: white;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              padding: 20px;
              box-sizing: border-box;
            }
            .mini-player {
              width: 100%;
              max-width: 340px;
              background: linear-gradient(145deg, #121212, #1d1d1d);
              border: 1px solid rgba(255,120,0,.2);
              border-radius: 24px;
              padding: 24px;
              text-align: center;
              box-shadow: 0 20px 40px rgba(0,0,0,.45);
            }
            img {
              width: 100%;
              border-radius: 18px;
              margin-bottom: 18px;
            }
            h1 {
              margin: 0 0 10px;
              font-size: 28px;
            }
            p {
              color: rgba(255,255,255,.75);
              margin-bottom: 20px;
            }
            audio {
              width: 100%;
            }
          </style>
        </head>
        <body>
          <div class="mini-player">
            <img src="attached_assets/logo_1749601460841.jpeg" alt="Sonar Rock">
            <h1>SONAR ROCK</h1>
            <p>La Radio Independiente</p>
            <audio controls autoplay playsinline>
              <source src="${STREAM_URL}" type="audio/mpeg">
            </audio>
          </div>
        </body>
        </html>
      `);

      popup.document.close();
    });
  }

  // =========================
  // STATUS
  // =========================
  function updateStatus(text, state = "") {
    if (statusText) statusText.textContent = text;

    if (statusDot) {
      statusDot.classList.remove("live", "loading", "error");

      if (state) {
        statusDot.classList.add(state);
      }
    }
  }
});
