document.addEventListener("DOMContentLoaded", function() {

  const rssUrl = "https://feeds.ivoox.com/feed_fg_f12661206_filtro_1.xml";
  const apiUrl = "https://api.rss2json.com/v1/api.json?rss_url=" + encodeURIComponent(rssUrl);

  fetch(apiUrl)
    .then(res => res.json())
    .then(data => {

      const epi = data.items[0];

      const title = epi.title;
      const audioUrl = epi.enclosure.link;
      const image = epi.thumbnail || data.feed.image || "";

      document.getElementById("ivoox-title").textContent = title;
      document.getElementById("ivoox-audio").src = audioUrl;
      document.getElementById("ivoox-cover").src = image;

    })
    .catch(err => {
      console.error("Error al cargar podcast:", err);
    });

});
