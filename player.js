// ====== Reproductor ======
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
});

// Barra de progreso y contador
audio.addEventListener("timeupdate", () => {
  if(audio.duration){
    const percent = (audio.currentTime / audio.duration) * 100;
    progress.style.width = percent + "%";
  }

  let minutes = Math.floor(audio.currentTime / 60);
  let seconds = Math.floor(audio.currentTime % 60);
  if(seconds<10) seconds="0"+seconds;
  timeDisplay.textContent = `${minutes}:${seconds}`;
});

// Reinicia barra al finalizar
audio.addEventListener("ended", () => {
  progress.style.width = "0%";
  playPauseBtn.innerHTML='<i class="fas fa-play"></i>';
  timeDisplay.textContent="00:00";
});

// ====== Matrix animado ======
const canvas = document.getElementById("matrixCanvas");
const ctx = canvas.getContext("2d");

function resizeCanvas(){ 
  canvas.width = canvas.parentElement.offsetWidth; 
  canvas.height = canvas.parentElement.offsetHeight; 
}
window.addEventListener('resize', resizeCanvas); 
resizeCanvas();

const letters="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*()*&^%";
const fontSize=20;
const columns=Math.floor(canvas.width/fontSize);
let drops=Array.from({length:columns},()=>Math.random()*canvas.height);
let trails = Array.from({length:columns},()=>[]);

function drawMatrix(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.font=fontSize+"px monospace";

  for(let i=0;i<columns;i++){
    const text=letters.charAt(Math.floor(Math.random()*letters.length));
    let yPos=drops[i]*fontSize;

    trails[i].push({char:text, y:yPos, brightness:255});
    if(trails[i].length>20) trails[i].shift();

    trails[i].forEach(t=>{
      ctx.fillStyle=`rgb(0,${t.brightness},0)`;
      ctx.fillText(t.char,i*fontSize,t.y);
      t.brightness = Math.max(50,t.brightness-12);
    });

    if(yPos>canvas.height && Math.random()>0.975){ 
      drops[i]=0; 
      trails[i]=[]; 
    }
    drops[i]++;
  }
}

// Velocidad reducida ~40%
setInterval(drawMatrix,40);
