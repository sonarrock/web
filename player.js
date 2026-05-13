const API_URL = "https://sonarrock-api.cmrm1982.workers.dev/";

let last = "";

async function fetchNowPlaying() {
  try {
    const res = await fetch(API_URL + "?t=" + Date.now(), { cache: "no-store" });
    const data = await res.json();

    if (!data) return;

    const artist = data.artist || "SONAR ROCK";
    const title = data.title || "Transmitiendo rock sin concesiones";

    const current = artist + " - " + title;

    if (current === last) return;
    last = current;

    document.getElementById("trackInfo").textContent = title;
    document.getElementById("trackArtist").textContent = artist;

    const cover = data.cover || "/attached_assets/logo_1749601460841.jpeg";
    document.getElementById("stationCover").src = cover;

    console.log("🎵 NOW PLAYING:", current);

  } catch (e) {
    console.log("metadata error:", e);
  }
}

setInterval(fetchNowPlaying, 4000);
fetchNowPlaying();
