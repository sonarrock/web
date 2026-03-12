// ==============================
// SONAR ROCK - RADIO PLAYER PRO
// ==============================

document.addEventListener("DOMContentLoaded", () => {

const audio = document.getElementById("radio-audio");
const playBtn = document.getElementById("playPauseBtn");
const stopBtn = document.getElementById("stop-btn");
const muteBtn = document.getElementById("mute-btn");
const volumeSlider = document.getElementById("volume");
const statusText = document.getElementById("status-text");
const timerEl = document.getElementById("timer");
const container = document.querySelector(".player-container");

const STREAM_URL = "https://stream.zeno.fm/ezq3fcuf5ehvv";

let isPlaying = false;
let reconnectAttempts = 0;
let reconnectTimer = null;
let timerInterval = null;
let seconds = 0;
let clickLock = false;

const BASE_DELAY = 2000;
const MAX_DELAY = 20000;

window.globalActiveAudio = null;


// =============================
// CONFIG INICIAL
// =============================

audio.preload = "none";
audio.crossOrigin = "anonymous";

audio.volume = parseFloat(localStorage.getItem("radioVolume")) || 1;
volumeSlider.value = audio.volume;

const savedMuted = localStorage.getItem("radioMuted") === "true";
audio.muted = savedMuted;

muteBtn.innerHTML = audio.muted
? '<i class="fas fa-volume-mute"></i>'
: '<i class="fas fa-volume-up"></i>';

updateStatus("OFFLINE");


// =============================
// STATUS
// =============================

function updateStatus(status){
statusText.textContent = status.toUpperCase();
}


// =============================
// TIMER
// =============================

function startTimer(){

clearInterval(timerInterval);

timerInterval = setInterval(()=>{

seconds++;

const m = String(Math.floor(seconds/60)).padStart(2,"0");
const s = String(seconds%60).padStart(2,"0");

timerEl.textContent = `${m}:${s}`;

},1000)

}

function stopTimer(){

clearInterval(timerInterval);
seconds = 0;
timerEl.textContent="00:00";

}


// =============================
// CONECTAR STREAM
// =============================

function startStream(){

audio.src = STREAM_URL + "?nocache=" + Date.now();

audio.load();

audio.play()
.then(()=>{

isPlaying = true;

})
.catch(err=>{

console.warn("Error play:",err);

updateStatus("ERROR PLAY");

})

}


// =============================
// RECONEXION PRO
// =============================

function reconnect(){

if(!isPlaying) return;

clearTimeout(reconnectTimer);

reconnectAttempts++;

updateStatus("RECONECTANDO");

const delay = Math.min(BASE_DELAY * reconnectAttempts, MAX_DELAY);

reconnectTimer = setTimeout(()=>{

startStream();

},delay)

}


// =============================
// EVENTOS AUDIO
// =============================

audio.addEventListener("loadstart", ()=>{

updateStatus("CONECTANDO");

});

audio.addEventListener("waiting", ()=>{

if(isPlaying) updateStatus("BUFFERING");

});

audio.addEventListener("playing", ()=>{

updateStatus("EN VIVO");

container.classList.add("playing");

playBtn.innerHTML='<i class="fas fa-pause"></i>';

reconnectAttempts = 0;

startTimer();

});

audio.addEventListener("pause", ()=>{

if(!audio.ended) resetUI();

});

audio.addEventListener("stalled", reconnect);
audio.addEventListener("error", reconnect);
audio.addEventListener("ended", reconnect);


// =============================
// PLAY / PAUSE
// =============================

playBtn.addEventListener("click", ()=>{

if(clickLock) return;

clickLock=true;
setTimeout(()=>clickLock=false,300);

if(!isPlaying){

if(window.globalActiveAudio && window.globalActiveAudio !== audio){
window.globalActiveAudio.pause();
}

window.globalActiveAudio = audio;

startStream();

}else{

audio.pause();

}

});


// =============================
// STOP
// =============================

stopBtn.addEventListener("click", ()=>{

audio.pause();

audio.removeAttribute("src");
audio.load();

reconnectAttempts=0;

resetUI();

});


function resetUI(){

isPlaying=false;

stopTimer();

container.classList.remove("playing");

playBtn.innerHTML='<i class="fas fa-play"></i>';

updateStatus("OFFLINE");

}


// =============================
// MUTE
// =============================

muteBtn.addEventListener("click",()=>{

audio.muted=!audio.muted;

localStorage.setItem("radioMuted",audio.muted);

muteBtn.innerHTML = audio.muted
? '<i class="fas fa-volume-mute"></i>'
: '<i class="fas fa-volume-up"></i>';

});


// =============================
// VOLUMEN
// =============================

volumeSlider.addEventListener("input",e=>{

audio.volume=e.target.value;

localStorage.setItem("radioVolume",e.target.value);

});

});
