document.addEventListener("DOMContentLoaded", () => {
  const playerContainer = document.getElementById("podcast-player");

  if(!playerContainer) return;

  const iframeHTML = `
    <iframe 
      src="https://www.ivoox.com/player_es_podcast_2661206_zp_1.html?c1=141c24"
      width="100%"
      height="150"
      frameborder="0"
      allowfullscreen
      scrolling="no"
      loading="lazy">
    </iframe>
  `;

  playerContainer.innerHTML = iframeHTML;
});
