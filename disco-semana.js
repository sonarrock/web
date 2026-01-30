document.addEventListener("DOMContentLoaded", () => {
  console.log("disco-semana.js cargado");

  const audio = document.getElementById("disco-audio");
  const cover = document.getElementById("cover");
  const title = document.getElementById("track-title");

  console.log("audio:", audio);
  console.log("cover:", cover);
  console.log("title:", title);

  if (!audio || !cover || !title) {
    console.error("❌ Elementos del Disco de la Semana no encontrados");
    return;
  }

  const discoData = {
    title: "Aretha Franklin – Lady Soul",
    src: "https://www.dropbox.com/scl/fi/l2n20n2zkwkwxibnggtmh/Aretha-Franklin-Lady-Soul.mp3?dl=1",
    cover: "web/attached_assets/portada.jpg"
  };

  title.textContent = discoData.title;
  cover.src = discoData.cover;
  audio.src = discoData.src;

  audio.load();
  console.log("✅ Disco de la semana listo");
});
