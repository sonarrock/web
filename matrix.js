const canvas = document.getElementById("matrixCanvas");
const ctx = canvas.getContext("2d");

const katakana =
  "アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズヅブプエェケセテネヘメレヱゲゼデベペオォコソトノホモヨョロヲゴゾドボポヴッン";
const latin = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const nums = "0123456789";
const chars = katakana + latin + nums;

const fontSize = 14;
let drops = [];

/**
 * Inicializa columnas según tamaño actual del canvas
 * (el tamaño lo define player.js)
 */
function initMatrix() {
  const columns = Math.floor(canvas.width / fontSize);
  drops = Array(columns).fill(1);
}

/**
 * Dibuja un frame del efecto Matrix
 * (player.js controla cuándo se llama)
 */
function drawMatrixFrame() {
  if (!ctx) return;

  ctx.fillStyle = "rgba(0, 0, 0, 0.08)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#ff6600";
  ctx.font = `${fontSize}px monospace`;

  drops.forEach((y, i) => {
    const x = i * fontSize;
    const text = chars.charAt(Math.floor(Math.random() * chars.length));
    ctx.fillText(text, x, y * fontSize);

    if (y * fontSize > canvas.height && Math.random() > 0.975) {
      drops[i] = 0;
    }

    drops[i]++;
  });
}

/**
 * Limpia completamente el canvas
 */
function clearMatrix() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}
