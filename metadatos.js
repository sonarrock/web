// metadatos.js
// Este archivo está listo para integrar metadatos en vivo desde iTunes cuando tengas el endpoint.

// Ejemplo de función para cargar metadatos en vivo (personaliza cuando tengas el endpoint)
async function loadITunesMetadata() {
  const nowPlaying = document.getElementById('now-playing');
  nowPlaying.textContent = ""; // No muestra nada por ahora

  // Cuando tengas el endpoint de iTunes, reemplaza la lógica de abajo:
  /*
  try {
    const response = await fetch('ENDPOINT_DE_ITUNES_AQUI');
    const data = await response.json();
    // Personaliza aquí según el formato del endpoint:
    nowPlaying.innerHTML = `
      <div>
        <strong>${data.titulo}</strong><br>
        <small>${data.fecha}</small>
      </div>
    `;
  } catch (err) {
    nowPlaying.textContent = "No se pudieron cargar los metadatos.";
    console.error("Error cargando metadatos:", err);
  }
  */
}

// Cargar al inicio
document.addEventListener('DOMContentLoaded', loadITunesMetadata);