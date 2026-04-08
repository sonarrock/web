document.addEventListener("DOMContentLoaded", async () => {
  const audio = document.getElementById("disco-audio");
  const cover = document.getElementById("cover");
  const trackTitle = document.getElementById("track-title");
  const player = document.getElementById("disco-player");

  const playBtn = document.getElementById("disco-play-btn");
  const playIcon = document.getElementById("disco-play-icon");
  const progress = document.getElementById("disco-progress");
  const currentTimeEl = document.getElementById("disco-current-time");
  const durationEl = document.getElementById("disco-duration");
  const statusEl = document.getElementById("disco-status");

  if (!audio || !cover || !trackTitle || !player || !playBtn || !progress) return;

  let isSeeking = false;

  function formatTime(seconds) {
    if (!isFinite(seconds) || seconds < 0) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }

  function updateProgressUI(value = 0) {
    const percent = Math.max(0, Math.min(100, value));
    progress.value = percent;
    progress.style.background = `linear-gradient(to right, #ff7a1a 0%, #ffb067 ${percent}%, rgba(255,255,255,0.14) ${percent}%, rgba(255,255,255,0.14) 100%)`;
  }

  function updatePlayUI(playing) {
    if (playIcon) playIcon.textContent = playing ? "❚❚" : "▶";
    player.classList.toggle("playing", playing);
    if (statusEl) statusEl.textContent = playing ? "Reproduciendo ahora" : "Listo para reproducir";
  }

  async function togglePlay() {
    try {
      if (audio.paused) {
        await audio.play();
      } else {
        audio.pause();
      }
    } catch (error) {
      console.error("Error reproduciendo Disco de la Semana:", error);
      if (statusEl) statusEl.textContent = "No se pudo reproducir";
    }
  }

  playBtn.addEventListener("click", togglePlay);

  progress.addEventListener("input", () => {
    isSeeking = true;
    updateProgressUI(parseFloat(progress.value || 0));
  });

  progress.addEventListener("change", () => {
    if (audio.duration && isFinite(audio.duration)) {
      const seekTime = (parseFloat(progress.value) / 100) * audio.duration;
      audio.currentTime = seekTime;
    }
    isSeeking = false;
  });

  audio.addEventListener("play", () => {
    updatePlayUI(true);
  });

  audio.addEventListener("pause", () => {
    updatePlayUI(false);
  });

  audio.addEventListener("ended", () => {
    updatePlayUI(false);
    audio.currentTime = 0;
    updateProgressUI(0);
    if (currentTimeEl) currentTimeEl.textContent = "0:00";
  });

  audio.addEventListener("loadedmetadata", () => {
    if (durationEl) durationEl.textContent = formatTime(audio.duration);
    if (currentTimeEl) currentTimeEl.textContent = "0:00";
    updateProgressUI(0);
  });

  audio.addEventListener("timeupdate", () => {
    if (!isSeeking && audio.duration) {
      const percent = (audio.currentTime / audio.duration) * 100;
      updateProgressUI(percent);
    }

    if (currentTimeEl) currentTimeEl.textContent = formatTime(audio.currentTime);
  });

  audio.addEventListener("error", () => {
    console.error("Error en audio de Disco de la Semana");
    if (statusEl) statusEl.textContent = "Error al cargar audio";
    updatePlayUI(false);
  });

  try {
    const response = await fetch("disco-semana.json", { cache: "no-store" });

    if (!response.ok) {
      throw new Error("No se pudo cargar disco-semana.json");
    }

    const discoData = await response.json();

    // Título
    trackTitle.textContent = discoData.titulo || "Disco de la Semana";

    // Portada
    cover.style.opacity = "0.55";
    cover.onload = () => {
      cover.style.opacity = "1";
    };
    cover.src = discoData.portada || "";
    cover.alt = discoData.titulo || "Portada Disco";

    // Audio
    audio.src = discoData.audio || "";
    audio.load();

    if (statusEl) statusEl.textContent = "Listo para reproducir";

  } catch (error) {
    console.error("Error cargando Disco de la Semana:", error);
    trackTitle.textContent = "No se pudo cargar el Disco de la Semana";
    if (statusEl) statusEl.textContent = "Contenido no disponible";
  }
});



