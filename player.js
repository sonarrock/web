document.addEventListener("DOMContentLoaded", () => {

  // ================= ELEMENTOS =================
  const audio = document.getElementById("radioPlayer");
  const playBtn = document.getElementById("playBtn");
  const playIcon = document.getElementById("playIcon");

  const miniPlayBtn = document.getElementById("miniPlayBtn");
  const miniPlayIcon = document.getElementById("miniPlayIcon");

  const trackInfo = document.getElementById("trackInfo");
  const trackArtist = document.getElementById("trackArtist");
  const stationCover = document.getElementById("stationCover");
  const statusText = document.getElementById("statusText");

  if (!audio || !playBtn) return;

  // ================= CONFIG =================
  const STREAM_URL = "https://giss.tv:667/sonarrock.mp3";
  const API_URL = "https://sonarrock-api.cmrm1982.workers.dev/";
  const SPOTIFY_API = "https://sonarrock-spotify.cmrm1982.workers.dev/";

  const DEFAULT_TRACK = "Transmitiendo rock sin concesiones";
  const DEFAULT_ARTIST = "SONAR ROCK";
  const DEFAULT_COVER = window.location.origin + "/attached_assets/logo_1749601460841.jpeg";

  let isPlaying = false;
  let lastTitle = "";
  let metadataTimer = null;

  // ================= AUDIO CONFIG =================
  audio.preload = "none";
  audio.setAttribute("playsinline", "");
  audio.setAttribute("webkit-playsinline", "");

  // ================= STATUS =================
  function setStatus(state) {
    const map = {
      loading:   "Conectando...",
      live:      "En vivo",
      buffering: "Bufferizando...",
      paused:    "Pausado",
      error:     "Sin señal",
      ready:     "Listo"
    };
    if (statusText) statusText.textContent = map[state] || state;
  }

  // ================= UI =================
  function updatePlayUI(playing) {
    isPlaying = playing;
    if (playIcon)     playIcon.textContent     = playing ? "❚❚" : "▶";
    if (miniPlayIcon) miniPlayIcon.textContent = playing ? "❚❚" : "▶";
  }

  function updateTrack(title, artist) {
    if (trackInfo)   trackInfo.textContent   = title;
    if (trackArtist) trackArtist.textContent = artist;
  }

 // ================= FONDO DINÁMICO =================
function updateBackground(imageUrl) {
  const player = document.querySelector(".sonar-player");
  if (!player) return;

  player.style.setProperty("--dynamic-bg", `url('${imageUrl}')`);
}

  // ================= PORTADAS =================
  function setCover(url) {
    if (!stationCover) return;

    const fallback = DEFAULT_COVER;

    const finalUrl = url ? url.replace("http://", "https://").split("?")[0] : fallback;

    const img = new Image();

    img.onload = () => {
      const withCache = finalUrl + "?v=" + Date.now();

      // portada visible
      stationCover.src = withCache;

      // 🔥 fondo dinámico
      updateBackground(withCache);
    };

    img.onerror = () => {
      stationCover.src = fallback;
      updateBackground(fallback);
    };

    img.src = finalUrl;
  }

  // ================= TOAST =================
  function showToast(text) {
    const toast = document.getElementById("songToast");
    const span  = document.getElementById("toastSong");

    if (!toast || !span) return;

    span.textContent = text;
    toast.classList.add("show");

    setTimeout(() => toast.classList.remove("show"), 3000);
  }

  // ================= TEXTO =================
  function cleanText(text = "") {
    try { text = decodeURIComponent(text); } catch {}

    return text
      .replace(/\+/g,    " ")
      .replace(/%20/g,   " ")
      .replace(/&amp;/g, "&")
      .replace(/&#39;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/\s+/g,   " ")
      .trim();
  }

  // ================= MEDIA SESSION =================
  function updateMediaSession(title, artist, cover) {
    if (!("mediaSession" in navigator)) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title,
      artist,
      album:   "Sonar Rock",
      artwork: [{ src: cover, sizes: "512x512", type: "image/png" }]
    });
  }

// ================= METADATA =================
async function fetchMetadata() {
  try {
    const res = await fetch(API_URL + "?t=" + Date.now(), { cache: "no-store" });

    if (!res.ok) {
      console.warn("API no respondió bien");
      return;
    }

    const data = await res.json();

    if (!data || !data.title) {
      console.warn("Sin metadata válida");
      return;
    }

    const title  = cleanText(data.title);
    const artist = cleanText(data.artist || DEFAULT_ARTIST);

    if (!title || title === lastTitle) return;
    lastTitle = title;

    // 🔥 ACTUALIZA TEXTO SIEMPRE
    updateTrack(title, artist);

    // ================= SPOTIFY =================
    let cover = DEFAULT_COVER;

    try {
      const spotifyRes = await fetch(
        `${SPOTIFY_API}?artist=${encodeURIComponent(artist)}&title=${encodeURIComponent(title)}`
      );

      if (spotifyRes.ok) {
        const spotifyData = await spotifyRes.json();

        if (spotifyData && spotifyData.cover) {
          cover = spotifyData.cover;
        }
      }

    } catch (e) {
      console.warn("Spotify cover error:", e);
    }

    // 🔥 ASEGURAR QUE SIEMPRE SE EJECUTA
    setCover(cover);
    updateMediaSession(title, artist, cover);
    showToast(`${artist} - ${title}`);

    // 🔥 FONDO DINÁMICO CORRECTO (EL BUENO)
    const player = document.querySelector(".sonar-player");
    if (player && cover) {
      player.style.setProperty("--dynamic-bg", `url('${cover}')`);
    }

  } catch (e) {
    console.warn("Metadata fetch error:", e);
  }
}
  // ================= METADATA LOOP =================
  function startMetadata() {
    stopMetadata();
    fetchMetadata();
    metadataTimer = setInterval(fetchMetadata, 6000);
  }

  function stopMetadata() {
    if (metadataTimer) {
      clearInterval(metadataTimer);
      metadataTimer = null;
    }
  }

  // ================= PLAY =================
  async function playStream() {
    try {
      setStatus("loading");

      audio.src = STREAM_URL + "?t=" + Date.now();
      audio.load();
      await audio.play();

      updatePlayUI(true);
      setStatus("live");
      startMetadata();

    } catch (e) {
      console.warn("Play error:", e);
      setStatus("ready");
      updatePlayUI(false);
    }
  }

  function pauseStream() {
    audio.pause();
    audio.src = "";
    stopMetadata();
    updatePlayUI(false);
    setStatus("paused");
  }

  function togglePlay() {
    isPlaying ? pauseStream() : playStream();
  }

  // ================= EVENTOS BOTONES =================
  playBtn.addEventListener("click", togglePlay);
  if (miniPlayBtn) miniPlayBtn.addEventListener("click", togglePlay);

  // ================= EVENTOS AUDIO =================
  audio.addEventListener("playing", () => setStatus("live"));
  audio.addEventListener("waiting", () => isPlaying && setStatus("buffering"));
  audio.addEventListener("error", () => {
    console.warn("Audio error — stream no disponible");
    setStatus("error");
    updatePlayUI(false);
    stopMetadata();
  });

  // ================= INIT =================
  updateTrack(DEFAULT_TRACK, DEFAULT_ARTIST);
  setCover(DEFAULT_COVER); // 🔥 también pone fondo desde inicio
  updatePlayUI(false);
  setStatus("ready");

});

const API = "https://sonarrock-api.cmrm1982.workers.dev/";

let last = "";

async function sync() {
  try {
    const res = await fetch(API, { cache: "no-store" });
    const data = await res.json();

    const current = data.artist + " - " + data.title;

    if (current !== last) {
      last = current;

      console.log("🎵 Now Playing:", current);

      // 👇 AJUSTA ESTO A TU PLAYER
      document.getElementById("artist").innerText = data.artist;
      document.getElementById("title").innerText = data.title;

      if (data.cover) {
        document.getElementById("cover").src = data.cover;
      }
    }

  } catch (e) {
    console.log("sync error", e);
  }
}

setInterval(sync, 2000);
sync();
