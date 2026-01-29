document.addEventListener("DOMContentLoaded", async () => {

  const container = document.getElementById("podcast-player");
  if (!container) return;

  try {
    const res = await fetch(
      "https://corsproxy.io/?https://www.ivoox.com/feed_fg_f12661206_filtro_1.xml"
    );
    const text = await res.text();
    const xml = new DOMParser().parseFromString(text, "text/xml");

    const item = xml.querySelector("item");
    if (!item) throw "Sin episodios";

    const title = item.querySelector("title").textContent;
    const audioUrl = item.querySelector("enclosure").getAttribute("url");

    container.innerHTML = `
      <h3>${title}</h3>
      <audio controls style="width:100%">
        <source src="${audioUrl}" type="audio/mpeg">
      </audio>
    `;

  } catch (e) {
    container.innerHTML = "<p>Error cargando iVoox</p>";
    console.error(e);
  }
});
