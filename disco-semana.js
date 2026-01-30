document.addEventListener("DOMContentLoaded", () => {
  const audio = document.getElementById("disco-audio");
  const cover = document.getElementById("cover");
  const title = document.getElementById("track-title");

  if (!audio || !cover || !title) {
    console.warn("Disco de la semana: elementos no encontrados");
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
});
