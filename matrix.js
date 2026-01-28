const canvas = document.getElementById('matrixCanvas');
const ctx = canvas.getContext('2d');

// Ajusta el tamaño del canvas al contenedor (320x560px definido en CSS)
canvas.width = 320;
canvas.height = 560;

const katakana = 'アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズヅブプエェケセテネヘメレヱゲゼデベペオォコソトノホモヨョロヲゴゾドボポヴッン';
const latin = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const nums = '0123456789';
const chars = katakana + latin + nums;

const fontSize = 10;
const columns = canvas.width / fontSize;
const drops = [];

// x below is the x coordinate
// 1 = y co-ordinate of the drop(same for every drop initially)
for (let x = 0; x < columns; x++) {
  drops[x] = 1;
}

// Loop the animation
function drawMatrix() {
  // Oscurece ligeramente todo el canvas con una opacidad baja para el efecto de rastro
  ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Color de los caracteres (Naranja para Sonar Rock)
  ctx.fillStyle = '#ff6600'; 
  ctx.font = fontSize + 'px monospace';

  // Recorre las gotas
  for (let i = 0; i < drops.length; i++) {
    // Un carácter Unicode aleatorio de nuestra lista
    const text = chars.charAt(Math.floor(Math.random() * chars.length));
    
    // x = i*fontSize, y = drops[i]*fontSize
    ctx.fillText(text, i * fontSize, drops[i] * fontSize);

    // Envía la gota de vuelta arriba si está por debajo del borde inferior + un random
    if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
      drops[i] = 0;
    }

    // Incrementa la coordenada y de la gota
    drops[i]++;
  }
}

// Inicia el bucle de animación a 30 FPS
setInterval(drawMatrix, 33); 
