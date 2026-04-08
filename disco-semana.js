/* ===============================
   DISCO DE LA SEMANA — JSON AUTOLOAD
=============================== */
document.addEventListener("DOMContentLoaded", () => {
  const audio = document.getElementById("disco-audio");
  const playBtn = document.getElementById("disco-play-btn");
  const progressFill = document.getElementById("disco-progress-fill");
  const coverImg = document.getElementById("disco-cover-img");
  const titleEl = document.getElementById("disco-title");
  const artistEl = document.getElementById("disco-artist");
  const metaEl = document.getElementById("disco-meta");

  if (!audio || !playBtn || !progressFill || !coverImg || !titleEl) return;

  let isPlaying = false;

  // ========= CARGAR JSON =========
  fetch("disco-semana/info.json")
    .then(response => {
      if (!response.ok) throw new Error("No se pudo cargar info.json");
      return response.json();
    })
    .then(data => {
      const tituloCompleto = data.titulo || "Disco de la Semana";
      const audioSrc = data.audio || "";
      const portadaSrc = data.portada || "disco-semana/portada.jpg";

      // Separar artista y álbum automáticamente si viene "Artista - Álbum"
      let artista = "Sonar Rock";
      let album = tituloCompleto;

      if (tituloCompleto.includes(" - ")) {
        const partes = tituloCompleto.split(" - ");
        artista = partes[0].trim();
        album = partes.slice(1).join(" - ").trim();
      }

      titleEl.textContent = album;
      artistEl.textContent = artista;
      metaEl.textContent = "Disco destacado";

      coverImg.style.opacity = "0.4";

      const nuevaImg = new Image();
      nuevaImg.src = portadaSrc;
      nuevaImg.onload = () => {
        coverImg.src = portadaSrc;
        setTimeout(() => {
          coverImg.style.opacity = "1";
        }, 120);
      };

      audio.src = audioSrc;
    })
    .catch(error => {
      console.warn("Error cargando disco-semana/info.json:", error);
      titleEl.textContent = "No se pudo cargar el disco";
      artistEl.textContent = "Sonar Rock";
      metaEl.textContent = "Revisa disco-semana/info.json";
    });

  // ========= PLAY / PAUSE =========
  playBtn.addEventListener("click", async () => {
    try {
      if (!audio.src) return;

      if (!isPlaying) {
        await audio.play();
        isPlaying = true;
        playBtn.textContent = "⏸ Pausar";
      } else {
        audio.pause();
        isPlaying = false;
        playBtn.textContent = "▶ Escuchar";
      }
    } catch (err) {
      console.warn("No se pudo reproducir el preview:", err);
    }
  });

  // ========= PROGRESO =========
  audio.addEventListener("timeupdate", () => {
    if (!audio.duration) return;
    const percent = (audio.currentTime / audio.duration) * 100;
    progressFill.style.width = `${percent}%`;
  });

  audio.addEventListener("ended", () => {
    isPlaying = false;
    playBtn.textContent = "▶ Escuchar";
    progressFill.style.width = "0%";
  });

  audio.addEventListener("pause", () => {
    if (audio.currentTime < audio.duration && !audio.ended) {
      isPlaying = false;
      playBtn.textContent = "▶ Escuchar";
    }
  });

  audio.addEventListener("play", () => {
    isPlaying = true;
    playBtn.textContent = "⏸ Pausar";
  });
});

