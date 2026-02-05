console.log("🎵 Disco de la Semana JS cargado");

function initDiscoSemana() {
  const discoAudio = document.getElementById("disco-audio");
  const cover = document.getElementById("cover");
  const trackTitle = document.getElementById("track-title");

  if (!discoAudio || !cover || !trackTitle) {
    return false;
  }

  const discoData = {
    title: "Aretha Franklin – Lady Soul",
    audio: "disco-semana/aretha-franklin-lady-soul.mp3",
    cover: "disco-semana/portada.jpg"
  };

  cover.src = discoData.cover;
  trackTitle.textContent = discoData.title;
  discoAudio.src = discoData.audio;

  console.log("🎶 Disco de la Semana inicializado");
  return true;
}

// Intento inmediato
if (!initDiscoSemana()) {
  // Observa cambios en el DOM (cuando otro JS lo reescribe)
  const observer = new MutationObserver(() => {
    if (initDiscoSemana()) {
      observer.disconnect();
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}
