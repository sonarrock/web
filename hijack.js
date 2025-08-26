// Reproduce el audio de Zeno con control de eventos y evita autoplay en móviles
const audio = document.getElementById('audio');

audio.addEventListener('play', () => {
  console.log("Audio reproduciéndose");
  // Llamar metadatos en vivo al iniciar reproducción
  if (typeof loadITunesMetadata === "function") {
    loadITunesMetadata();
  }
});

audio.addEventListener('pause', () => {
  console.log("Audio pausado");
});

audio.addEventListener('ended', () => {
  console.log("Audio finalizado");
});
