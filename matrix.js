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

  // Ajusta el fondo para darle la apariencia de la Matrix
  ctx.fillStyle = "rgba(0, 0, 0, 0.08)";  // Semitransparente para dar el efecto de desvanecimiento
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Establecer el color del texto (el verde de la Matrix)
  ctx.fillStyle = "#ff6600";
  ctx.font = `${fontSize}px monospace`;

  // Dibujar los caracteres
  drops.forEach((y, i) => {
    const x = i * fontSize;
    const text = chars.charAt(Math.floor(Math.random() * chars.length));
    ctx.fillText(text, x, y * fontSize);

    // Reiniciar la columna cuando llega al final de la pantalla
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

/**
 * Activa la animación de la Matrix
 */
function startMatrix() {
  // Inicia la animación continua de la Matrix
  const animate = () => {
    drawMatrixFrame();
    requestAnimationFrame(animate);  // Recursividad para mantener la animación en loop
  };

  animate();  // Inicia la animación
}

/**
 * Detiene la animación de la Matrix
 */
function stopMatrix() {
  cancelAnimationFrame(animate);
  clearMatrix();  // Limpia la pantalla al detener la animación
}
