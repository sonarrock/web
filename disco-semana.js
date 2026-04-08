document.addEventListener("DOMContentLoaded", async () => {
  const player = document.getElementById("discoPlayer");
  const audio = document.getElementById("discoAudio");
  const cover = document.getElementById("discoCover");
  const title = document.getElementById("discoTitle");

  const playBtn = document.getElementById("discoPlayBtn");
  const stopBtn = document.getElementById("discoStopBtn");
  const muteBtn = document.getElementById("discoMuteBtn");
  const progress = document.getElementById("discoProgress");
  const currentTimeEl = document.getElementById("discoCurrentTime");
  const durationEl = document.getElementById("discoDuration");

  function formatTime(seconds) {
    if (isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
  }

  try {
    const res = await fetch("disco-semana/disco.json");
    const data = await res.json();

    title.textContent = data.titulo || "Disco de la Semana";
    cover.src = data.portada || "disco-semana/portada.jpg";
    audio.src = data.audio || "";
  } catch (err) {
    console.error("Error cargando disco.json:", err);
    title.textContent = "No se pudo cargar el disco de la semana";
  }

  playBtn.addEventListener("click", async () => {
    if (audio.paused) {
      try {
        await audio.play();
      } catch (err) {
        console.error("Error al reproducir:", err);
      }
    } else {
      audio.pause();
    }
  });

  stopBtn.addEventListener("click", () => {
    audio.pause();
    audio.currentTime = 0;
    progress.value = 0;
  });

  muteBtn.addEventListener("click", () => {
    audio.muted = !audio.muted;
    muteBtn.textContent = audio.muted ? "🔇" : "🔊";
  });

  audio.addEventListener("play", () => {
    player.classList.add("playing");
    playBtn.textContent = "❚❚";
  });

  audio.addEventListener("pause", () => {
    player.classList.remove("playing");
    playBtn.textContent = "▶";
  });

  audio.addEventListener("loadedmetadata", () => {
    durationEl.textContent = formatTime(audio.duration);
    progress.max = Math.floor(audio.duration || 0);
  });

  audio.addEventListener("timeupdate", () => {
    currentTimeEl.textContent = formatTime(audio.currentTime);
    progress.value = Math.floor(audio.currentTime || 0);
  });

  progress.addEventListener("input", () => {
    audio.currentTime = progress.value;
  });

  audio.addEventListener("ended", () => {
    player.classList.remove("playing");
    playBtn.textContent = "▶";
    progress.value = 0;
  });
});
