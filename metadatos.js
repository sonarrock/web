// Metadatos para iTunes / streaming
async function loadITunesMetadata() {
  const feedUrl = "https://corsproxy.io/?https://www.ivoox.com/feed_fg_f12661206_filtro_1.xml";
  const nowPlaying = document.getElementById('now-playing');

  try {
    const response = await fetch(feedUrl);
    const xmlText = await response.text();
    const parser = new DOMParser();
    const xml = parser.parseFromString(xmlText, "text/xml");

    const item = xml.querySelector("item");
    if (!item) throw new Error("No se encontró ningún episodio");

    const title = item.querySelector("title").textContent;
    const pubDate = new Date(item.querySelector("pubDate").textContent).toLocaleDateString();
    const imageUrl = item.querySelector("itunes\\:image, image")?.getAttribute("href") || "https://static-1.ivoox.com/img/podcast_default.jpg";

    nowPlaying.innerHTML = `
      <div style="display:flex; align-items:center; gap:10px;">
        <img src="${imageUrl}" alt="Carátula" style="width:50px; height:50px; object-fit:cover; border-radius:8px;">
        <div>
          <strong>${title}</strong><br>
          <small>${pubDate}</small>
        </div>
      </div>
    `;
  } catch (err) {
    nowPlaying.textContent = "No se pudieron cargar los metadatos";
    console.error("Error cargando metadatos:", err);
  }
}

// Cargar al inicio
document.addEventListener('DOMContentLoaded', loadITunesMetadata);
