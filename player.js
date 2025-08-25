document.addEventListener('DOMContentLoaded', () => {
  const audio = document.getElementById("cancion");
  const playBtn = document.getElementById("play-btn");
  const pauseBtn = document.getElementById("pause-btn");
  const muteBtn = document.getElementById("mute-btn");
  const canvas = document.getElementById("visualizer");
  const ctx = canvas.getContext("2d");

  function resizeCanvas() {
    canvas.width = canvas.parentElement.offsetWidth;
    canvas.height = canvas.parentElement.offsetHeight * 0.2; // 20% del contenedor
  }
  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();

  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

  playBtn.addEventListener("click", () => {
    if(audioCtx.state === "suspended") audioCtx.resume();
    audio.play().catch(err => console.log(err));
  });
  pauseBtn.addEventListener("click", () => audio.pause());
  muteBtn.addEventListener("click", () => {
    audio.muted = !audio.muted;
    muteBtn.innerHTML = audio.muted 
      ? `<i class="bi bi-volume-up-fill"></i>` 
      : `<i class="bi bi-volume-mute-fill"></i>`;
  });

  const bufferLength = 512;
  let previousY = new Array(bufferLength).fill(canvas.height/2);
  let phase = 0;

  function draw() {
    requestAnimationFrame(draw);
    ctx.clearRect(0,0,canvas.width,canvas.height);

    const gradient = ctx.createLinearGradient(0,0,canvas.width,0);
    gradient.addColorStop(0,'#ff6600');
    gradient.addColorStop(0.5,'#ffcc66');
    gradient.addColorStop(1,'#ff6600');
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 3;
    ctx.beginPath();

    const sliceWidth = canvas.width / bufferLength;
    let x = 0;
    phase += 0.02;

    for(let i=0;i<bufferLength;i++){
      const y = canvas.height/2 + Math.sin(i/10 + phase)*canvas.height/4*0.9;
      const smoothY = previousY[i]*0.8 + y*0.2;
      if(i===0) ctx.moveTo(x,smoothY);
      else ctx.lineTo(x,smoothY);
      previousY[i] = smoothY;
      x += sliceWidth;
    }
    ctx.lineTo(canvas.width, canvas.height/2);
    ctx.stroke();

    const brightness = audio.paused ? 0.1 : 0.5 + 0.3*Math.sin(phase*2);
    ctx.shadowColor = `rgba(255,204,102,${brightness})`;
    ctx.shadowBlur = 20*brightness;

    const glowIntensity = audio.paused ? 0.2 : 0.5 + 0.2*Math.sin(phase*3);
    document.querySelectorAll('#sonar-player-container .controles button').forEach(btn => {
      btn.style.boxShadow = `0 0 30px 10px rgba(255,204,102,${glowIntensity})`;
    });
  }

  draw();
});
