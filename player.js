const audio = document.getElementById("audio");
const playPauseBtn = document.getElementById("playPauseBtn");
const stopBtn = document.getElementById("stop-btn");
const muteBtn = document.getElementById("mute-btn");
const progress = document.getElementById("progress");
const timeDisplay = document.getElementById("time-display");
const nowPlaying = document.getElementById("now-playing");

// Play/Pause
playPauseBtn.addEventListener("click", () => {
  if(audio.paused){
    audio.play();
    playPauseBtn.innerHTML='<i class="fas fa-pause"></i>';
  } else {
    audio.pause();
    playPauseBtn.innerHTML='<i class="fas fa-play"></i>';
  }
});

// Stop
stopBtn.addEventListener("click", () => {
  audio.pause();
  audio.currentTime = 0;
  playPauseBtn.innerHTML='<i class="fas fa-play"></i>';
});

// Mute
muteBtn.addEventListener("click", () => {
  audio.muted = !audio.muted;
  muteBtn.innerHTML = audio.muted ? '<i class="fas fa-volume-mute"></i>' : '<i class="fas fa-volume-up"></i>';
  muteBtn.style.color = audio.muted ? '#ff0000' : '#ff6600';
});

// Barra de progreso y contador H:M:S
audio.addEventListener("timeupdate", () => {
  if(audio.duration){
    const percent = (audio.currentTime / audio.duration) * 100;
    progress.style.width = percent + "%";
  }

  let h = Math.floor(audio.currentTime / 3600);
  let m = Math.floor((audio.currentTime % 3600) / 60);
  let s = Math.floor(audio.currentTime % 60);

  if(h<10) h="0"+h;
  if(m<10) m="0"+m;
  if(s<10) s="0"+s;
  timeDisplay.textContent = `${h}:${m}:${s}`;
});

// Matrix animación
const canvas = document.getElementById("matrixCanvas");
const ctx = canvas.getContext("2d");

function resizeCanvas(){ 
  canvas.width = canvas.parentElement.offsetWidth; 
  canvas.height = canvas.parentElement.offsetHeight; 
}
window.addEventListener('resize', resizeCanvas); 
resizeCanvas();

const letters="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*()*&^%";
const fontSize=16;
const columns=Math.floor(canvas.width/fontSize);
let drops=Array.from({length:columns},()=>Math.random()*canvas.height);

function drawMatrix(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.font=fontSize+"px monospace";

  for(let i=0;i<columns;i++){
    const text=letters.charAt(Math.floor(Math.random()*letters.length));
    let yPos=drops[i]*fontSize;

    ctx.fillStyle="rgb(0,255,0)";
    ctx.fillText(text,i*fontSize,yPos);

    if(yPos>canvas.height && Math.random()>0.975){ 
      drops[i]=0; 
    }
    drops[i]+=0.3; // velocidad lenta ~30%
  }
}
setInterval(drawMatrix,40);
