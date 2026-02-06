document.addEventListener("DOMContentLoaded", () => {
  console.log("🎵 Disco de la Semana JS cargado");

  // Selecciona elementos del DOM
  const audio = document.getElementById("disco-audio");
  const cover = document.getElementById("cover");
  const title = document.getElementById("track-title");

  if (!audio || !cover || !title) return;

  // =========================
  // ⚡ CAMBIA SOLO ESTO CADA SEMANA
  // =========================
  const discoData = {
    title: "Aretha Franklin – Lady Soul",          // Título del disco
    audio: "disco-semana/aretha-franklin.mp3",    // Archivo MP3
    cover: "disco-semana/portada.jpg"             // Portada JPG/PNG
  };

  // =========================
  // NO TOCAR LO DEMÁS
  // =========================
  title.textContent = discoData.title;
  cover.src = discoData.cover;

  audio.src = discoData.audio;
  audio.load();

  audio.addEventListener("canplay", () => {
    console.log("✅ Audio listo");
  });

  audio.addEventListener("error", (e) => {
    console.error("❌ Error cargando el audio:", audio.error);
  });
});
