async function loadLatestIvooxEpisode() {
  const feedUrl = "https://corsproxy.io/?https://www.ivoox.com/feed_fg_f12661206_filtro_1.xml";
  const playerContainer = document.getElementById("podcast-player");

  try {
    const response = await fetch(feedUrl);
    const xmlText = await response.text();
    const parser = new DOMParser();
    const xml = parser.parseFromString(xmlText, "text/xml");

    const item = xml.querySelector("item");
    if (!item) throw new Error("No se encontró ningún episodio");

    const title = item.querySelector("title")?.textContent || "Episodio sin título";
    const audioUrl = item.querySelector("enclosure")?.getAttribute("url") || "";
    const pubDate = new Date(item.querySelector("pubDate")?.textContent || Date.now()).toLocaleDateString();
    const imageUrl = item.querySelector("itunes\\:image")?.getAttribute("href") ||
                     item.querySelector("image")?.textContent ||
                     "https://static-1.ivoox.com/img/podcast_default.jpg";

    // HTML alineado con el estilo de Disco de la semana
    const playerHTML = `
      <div class="custom-player disco-player" style="flex-direction:row; align-items:center; gap:15px; max-width:650px; margin:0 auto;">
        <img src="${imageUrl}" alt="Carátula episodio" style="width:140px;height:140px;border-radius:12px;object-fit:cover;border:3px solid #ff6600; box-shadow:0 0 25px rgba(255,102,0,0.8),0 0 50px rgba(255,102,0,0.4); flex-shrink:0;">
        <div class="player-info" style="display:flex; flex-direction:column; justify-content:space-between; flex:1;">
          <div id="podcast-title" style="font-weight:bold;color:#fff; font-size:1.1rem; text-shadow:0 0 8px rgba(255,102,0,0.6); margin-bottom:8px;">${title}</div>
          <p style="margin:0;color:#b3b3b3;font-size:0.85rem;">Publicado el ${pubDate}</p>
          <audio controls preload="none" style="width:100%; border-radius:8px; background:#111; box-shadow:0 0 20px rgba(255,102,0,0.4); margin-top:5px;">
            <source src="${audioUrl}" type="audio/mpeg">
            Tu navegador no soporta audio HTML5.
          </audio>
        </div>
      </div>
    `;

    playerContainer.innerHTML = playerHTML;

  } catch (error) {
    playerContainer.innerHTML = `<p style="color:#f00;">No se pudo cargar el reproductor. Intenta más tarde.</p>`;
    console.error("Error cargando feed iVoox:", error);
  }
}

document.addEventListener("DOMContentLoaded", loadLatestIvooxEpisode);
