const audio = document.getElementById("radio-audio");
const playBtn = document.getElementById("playPauseBtn");
const stopBtn = document.getElementById("stop-btn");
const liveBadge = document.getElementById("live-indicator");
const player = document.querySelector(".player-container");
const matrixCanvas = document.getElementById("matrixCanvas");

const matrixCtx = matrixCanvas.getContext("2d");

let audioCtx, analyser, source, animationId, startTime=null, isPlaying=false;
let matrixChars="SONARROCK101010";
let fontSize=14;
let matrixDrops=[];

function resizeCanvas(){
  const rect = player.getBoundingClientRect();
  matrixCanvas.width = rect.width;
  matrixCanvas.height = rect.height;
  const columns = Math.floor(rect.width / fontSize);
  matrixDrops = Array(columns).fill(1);
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);
window.addEventListener("orientationchange", resizeCanvas);

function initAudioCtx(){
  if(audioCtx) return;
  audioCtx = new (window.AudioContext||window.webkitAudioContext)();
  analyser = audioCtx.createAnalyser();
  source = audioCtx.createMediaElementSource(audio);
  source.connect(analyser);
  analyser.connect(audioCtx.destination);
}

function drawMatrix(){
  matrixCtx.fillStyle = "rgba(0,0,0,0.08)";
  matrixCtx.fillRect(0,0,matrixCanvas.width,matrixCanvas.height);

  matrixCtx.fillStyle="#ff6600";
  matrixCtx.font=`${fontSize}px monospace`;

  matrixDrops.forEach((y,i)=>{
    const x = i*fontSize;
    const text = matrixChars[Math.floor(Math.random()*matrixChars.length)];
    matrixCtx.fillText(text,x,y*fontSize);
    if(y*fontSize>matrixCanvas.height && Math.random()>0.975) matrixDrops[i]=0;
    matrixDrops[i]++;
  });
}

function animate(){
  drawMatrix();
  animationId=requestAnimationFrame(animate);
}

playBtn.addEventListener("click", async ()=>{
  initAudioCtx();
  if(audioCtx.state==="suspended") await audioCtx.resume();

  if(!isPlaying){
    liveBadge?.classList.add("buffering");
    liveBadge?.classList.remove("active");

    audio.play().then(()=>{
      isPlaying=true;
      startTime=Date.now();
      playBtn.innerHTML='<i class="fas fa-pause"></i>';
      player.classList.add("playing");

      liveBadge?.classList.remove("buffering");
      liveBadge?.classList.add("active");

      animate();
    }).catch(err=>console.error(err));
  } else {
    audio.pause();
    playBtn.innerHTML='<i class="fas fa-play"></i>';
    player.classList.remove("playing");
    cancelAnimationFrame(animationId);
    isPlaying=false;
  }
});

stopBtn.addEventListener("click", ()=>{
  audio.pause();
  audio.currentTime=0;
  playBtn.innerHTML='<i class="fas fa-play"></i>';
  player.classList.remove("playing");
  liveBadge?.classList.remove("active");
  cancelAnimationFrame(animationId);
  isPlaying=false;
});


/* ===============================
   AUTO-RECOVERY (SI ZENO SE CAE)
=============================== */
audio.addEventListener("error", () => {
  console.warn("⚠️ Stream interrumpido. Reintentando...");
  pauseRadio();
  setTimeout(() => audio.play().catch(() => {}), 3000);
});
