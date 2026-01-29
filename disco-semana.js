document.addEventListener("DOMContentLoaded", () => {
  // -----------------------------
  // CONFIGURACIÓN DEL DISCO DE LA SEMANA
  // -----------------------------
  const fileName = "Aretha Franklin - Lady Soul.mp3"; // Cambiar cada semana
  const audio = document.getElementById("disco-audio");
  const cover = document.getElementById("cover");
  const title = document.getElementById("track-title");
  const container = document.getElementById("disco-player");

  if (!audio || !cover || !title || !container) return;

  // Mostrar título
  title.textContent = fileName.replace(".mp3", "");

  // Asignar archivo de audio
  audio.src = `https://raw.githubusercontent.com/sonarrock/web/main/El%20Disco%20De%20La%20Semana/${encodeURIComponent(fileName)}`;
  audio.load();

  // Asignar portada
  cover.src = `https://raw.githubusercontent.com/sonarrock/web/main/El%20Disco%20De%20La%20Semana/portada.jpg?v=${Date.now()}`;
  cover.classList.add("disco-cover"); // asegura que se aplique el CSS correcto

  // Opcional: reproducir automáticamente
  // audio.play().catch(e => console.log("Autoplay bloqueado", e));

  // -----------------------------
  // ANIMACIÓN HALO
  // -----------------------------
  let haloInterval;
  container.addEventListener("mouseenter", () => {
    clearInterval(haloInterval);
    let intensity = 0.3;
    let direction = 1;
    haloInterval = setInterval(() => {
      intensity += 0.01 * direction;
      if (intensity > 0.8) direction = -1;
      if (intensity < 0.3) direction = 1;
      container.style.boxShadow = `0 0 ${60 * intensity + 50}px rgba(255,102,0,${intensity})`;
    }, 20);
  });

  container.addEventListener("mouseleave", () => {
    clearInterval(haloInterval);
    container.style.boxShadow = "0 0 30px rgba(255,102,0,0.3)";
  });
});
