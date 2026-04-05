document.addEventListener("DOMContentLoaded", async () => {
  const audio = document.getElementById("disco-audio");
  const cover = document.getElementById("cover");
  const trackTitle = document.getElementById("track-title");
  const player = document.getElementById("disco-player");
  const radioAudio = document.getElementById("radioPlayer");

  if (!audio || !cover || !trackTitle || !player) return;

  try {
    const response = await fetch("disco-semana.json", { cache: "no-store" });

    if (!response.ok) {
      throw new Error("No se pudo cargar disco-semana.json");
    }

    const discoData = await response.json();

    // Título
    trackTitle.textContent = discoData.titulo || "Disco de la Semana";

    // Portada
    cover.src = discoData.portada || "";
    cover.alt = discoData.titulo || "Portada Disco";

    // Audio
    audio.src = discoData.audio || "";
    audio.load();

    // Si se reproduce el disco, pausa la radio
    audio.addEventListener("play", () => {
      player.classList.add("playing");

      if (radioAudio && !radioAudio.paused) {
        radioAudio.pause();
      }
    });

    audio.addEventListener("pause", () => {
      player.classList.remove("playing");
    });

    audio.addEventListener("ended", () => {
      player.classList.remove("playing");
    });

    audio.addEventListener("error", () => {
      player.classList.remove("playing");
      console.error("Error cargando audio de Disco de la Semana");
    });

  } catch (error) {
    console.error("Error cargando Disco de la Semana:", error);
    trackTitle.textContent = "No se pudo cargar el Disco de la Semana";
  }
});
