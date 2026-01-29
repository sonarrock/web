async function loadLatestIvooxEpisode(){
  const feedUrl = "https://corsproxy.io/?https://www.ivoox.com/feed_fg_f12661206_filtro_1.xml";
  const playerContainer = document.getElementById("podcast-player");

  try {
    const response = await fetch(feedUrl);
    const xmlText = await response.text();
    const parser = new DOMParser();
    const xml = parser.parseFromString(xmlText,"text/xml");

    const item = xml.querySelector("item");
    if(!item) throw new Error("No se encontró ningún episodio");

    const title = item.querySelector("title").textContent;
    const audioUrl = item.querySelector("enclosure").getAttribute("url");
    const pubDate = new Date(item.querySelector("pubDate").textContent).toLocaleDateString();
    const imageUrl = item.querySelector("itunes\\:image, image")?.getAttribute("href") || "https://static-1.ivoox.com/img/podcast_default.jpg";

    const playerHTML = `
      <div class="podcast-episode" style="display:flex; gap:15px; align-items:center;">
        <img src="${imageUrl}" alt="Carátula episodio" style="width:140px;height:140px;border-radius:12px;object-fit:cover;border:2px solid #ff6600;box-shadow:0 0 20px rgba(255,102,0,0.5);">
        <div style="flex:1; display:flex; flex-direction:column; gap:5px;">
          <h3 style="margin:0;color:#fff;font-size:14px;">${title}</h3>
          <p style="margin:0;color:#b3b3b3;font-size:10px;">Publicado el ${pubDate}</p>
          <audio controls preload="none" style="width:100%; border-radius:8px; background:#222; box-shadow:0 0 15px rgba(255,102,0,0.4);">
            <source src="${audioUrl}" type="audio/mpeg">
            Tu navegador no soporta audio HTML5.
          </audio>
        </div>
      </div>
    `;
    playerContainer.innerHTML = playerHTML;

  } catch(error){
    playerContainer.innerHTML = `<p style="color:#f00;">No se pudo cargar el reproductor. Intenta más tarde.</p>`;
    console.error("Error cargando feed iVoox:", error);
  }
}

document.addEventListener("DOMContentLoaded", loadLatestIvooxEpisode);
