document.addEventListener("DOMContentLoaded", () => {
  console.log("🎵 Disco de la Semana JS cargado");

  const audio = document.getElementById("disco-audio");
  const cover = document.getElementById("cover");
  const title = document.getElementById("track-title");

  if (!audio || !cover || !title) return;

  title.textContent = "Aretha Franklin – Lady Soul";
  cover.src = "disco-semana/portada.jpg";

  audio.src = "disco-semana/aretha-franklin-lady-soul-fixed.mp3";
  audio.load();

  audio.addEventListener("canplay", () => {
    console.log("✅ Audio listo");
  });
});
