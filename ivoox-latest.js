document.addEventListener("DOMContentLoaded", () => {
  const playerContainer = document.getElementById("podcast-player");
  if (!playerContainer) return;

  // HTML del iframe con estilo tipo "Disco de la semana"
  const iframeHTML = `
    <div class="custom-player disco-player" style="
      max-width:650px;
      margin:0 auto;
      display:flex;
      flex-direction:column;
      align-items:center;
      border-radius:18px;
      overflow:hidden;
      border:3px solid #ff6600;
      box-shadow:0 0 30px rgba(255,102,0,0.6);
      background: rgba(0,0,0,0.4);
      animation: haloPulse 3s infinite alternate;
    ">
      <iframe 
        src="https://www.ivoox.com/player_es_podcast_2661206_zp_1.html?c1=141c24"
        width="100%"
        height="150"
        frameborder="0"
        allowfullscreen
        scrolling="no"
        loading="lazy"
        style="border:none; border-radius:12px;"
      ></iframe>
    </div>
  `;

  playerContainer.innerHTML = iframeHTML;
});
