document.addEventListener("DOMContentLoaded", () => {
  // =========================
  // 🎵 CONTROL DE AUDIO
  // =========================
  const audio = document.getElementById("audioPlayer");
  const playBtn = document.getElementById("playBtn");
  const stopBtn = document.getElementById("stopBtn");
  const muteBtn = document.getElementById("muteBtn");
  const playIcon = playBtn.querySelector("i");

  let isPlaying = false;

  // Play / Pause
  playBtn.addEventListener("click", () => {
    if (!isPlaying) {
      audio.play();
      playIcon.classList.remove("fa-play");
      playIcon.classList.add("fa-pause");
      isPlaying = true;
    } else {
      audio.pause();
      playIcon.classList.remove("fa-pause");
      playIcon.classList.add("fa-play");
      isPlaying = false;
    }
  });

  // Stop
  stopBtn.addEventListener("click", () => {
    audio.pause();
    audio.currentTime = 0;
    playIcon.classList.remove("fa-pause");
    playIcon.classList.add("fa-play");
    isPlaying = false;
  });

  // Mute
  muteBtn.addEventListener("click", () => {
    audio.muted = !audio.muted;
    if (audio.muted) {
      muteBtn.innerHTML = '<i class="fas fa-volume-off"></i>';
    } else {
      muteBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
    }
  });

  // =========================
  // 🟩 ANIMACIÓN MATRIX
  // =========================
  const canvas = document.getElementById("matrix");
  const ctx = canvas.getContext("2d");

  function resizeCanvas() {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
  }
  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);

  const letters = "アァカサタナハマヤラワ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  const fontSize = 14;
  let columns = Math.floor(canvas.width / fontSize);
  let drops = Array(columns).fill(1);

  function draw() {
    ctx.fillStyle = "rgba(0,0,0,0.05)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#0F0";
    ctx.font = fontSize + "px monospace";

    for (let i = 0; i < drops.length; i++) {
      let text = letters[Math.floor(Math.random() * letters.length)];
      ctx.fillText(text, i * fontSize, drops[i] * fontSize);

      if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
        drops[i] = 0;
      }
      drops[i]++;
    }
  }

  setInterval(draw, 33);
});
