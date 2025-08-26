// No se muestran metadatos ni mensajes porque Zeno.fm no los expone.
async function loadITunesMetadata() {
  const nowPlaying = document.getElementById('now-playing');
  nowPlaying.textContent = ""; // Área completamente limpia
}

document.addEventListener('DOMContentLoaded', loadITunesMetadata);
