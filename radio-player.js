// ======================================
// SONAR ROCK - RADIO PLAYER OPTIMIZED
// ======================================

document.addEventListener("DOMContentLoaded", () => {

const STREAM_URL = "https://stream.zeno.fm/ezq3fcuf5ehvv";

// ELEMENTOS
const audio = document.getElementById("radio-audio");
const playBtn = document.getElementById("playPauseBtn");
const stopBtn = document.getElementById("stop-btn");
const muteBtn = document.getElementById("mute-btn");
const volumeSlider = document.getElementById("volume");
const statusText = document.getElementById("status-text");
const timerEl = document.getElementById("timer");
const container = document.querySelector(".player-container");

// VARIABLES
let isPlaying = false;
let reconnectAttempts = 0;
let reconnectTimer = null;
let freezeMonitor = null;
let timerInterval = null;
let lastTime = 0;
let seconds = 0;

// CONFIG RECONEXIÓN
const BASE_DELAY = 2000;
const MAX_DELAY = 15000;

// CONTROL GLOBAL
window.globalActiveAudio = null;


// ======================================
// CONFIGURACIÓN INICIAL
// ======================================

audio.src = STREAM_URL;
audio.preload = "auto";
audio.crossOrigin = "anonymous";

// volumen guardado
audio.volume = parseFloat(localStorage.getItem("radioVolume")) || 1;
volumeSlider.value = audio.volume;

// mute guardado
audio.muted = localStorage.getItem("radioMuted") === "true";

updateMuteIcon();
updateStatus("OFFLINE");

// precarga stream
audio.load();


// ======================================
// STATUS
// ======================================

function updateStatus(text){

statusText.textContent = text.toUpperCase();

}


// ======================================
// TIMER
// ======================================

function startTimer(){

clearInterval(timerInterval);

timerInterval = setInterval(()=>{

seconds++;

const m = String(Math.floor(seconds/60)).padStart(2,"0");
const s = String(seconds%60).padStart(2,"0");

timerEl.textContent = `${m}:${s}`;

},1000);

}

function stopTimer(){

clearInterval(timerInterval);

seconds = 0;

timerEl.textContent = "00:00";

}


// ======================================
// INICIAR STREAM
// ======================================

function startStream(){

audio.play()
.then(()=>{

isPlaying = true;

})
.catch(err=>{

console.warn("Play bloqueado", err);
updateStatus("ERROR PLAY");

});

}


// ======================================
// DETENER STREAM
// ======================================

function stopStream(){

audio.pause();
isPlaying = false;

resetUI();

}


// ======================================
// DETECTOR DE CONGELAMIENTO
// ======================================

function startFreezeMonitor(){

clearInterval(freezeMonitor);

freezeMonitor = setInterval(()=>{

if(!audio.paused){

if(audio.currentTime === lastTime){

console.warn("Stream congelado");
reconnect();

}

lastTime = audio.currentTime;

}

},7000);

}

function stopFreezeMonitor(){

clearInterval(freezeMonitor);

}


// ======================================
// RECONEXIÓN INTELIGENTE
// ======================================

function reconnect(){

if(!isPlaying) return;

clearTimeout(reconnectTimer);

reconnectAttempts++;

updateStatus("RECONECTANDO");

const delay = Math.min(BASE_DELAY * reconnectAttempts, MAX_DELAY);

reconnectTimer = setTimeout(()=>{

audio.load();
audio.play();

}, delay);

}


// ======================================
// EVENTOS DEL AUDIO
// ======================================

audio.addEventListener("loadstart", ()=>{

updateStatus("CONECTANDO");

});

audio.addEventListener("playing", ()=>{

updateStatus("EN VIVO");

container.classList.add("playing");

playBtn.innerHTML = '<i class="fas fa-pause"></i>';

reconnectAttempts = 0;

startTimer();
startFreezeMonitor();

});

audio.addEventListener("waiting", ()=>{

if(isPlaying) updateStatus("BUFFERING");

});

audio.addEventListener("pause", ()=>{

if(!audio.ended) resetUI();

});

audio.addEventListener("stalled", reconnect);
audio.addEventListener("error", reconnect);
audio.addEventListener("ended", reconnect);


// ======================================
// PLAY / PAUSE
// ======================================

playBtn.addEventListener("click", ()=>{

if(!isPlaying){

// evitar doble audio en la página
if(window.globalActiveAudio && window.globalActiveAudio !== audio){

window.globalActiveAudio.pause();

}

window.globalActiveAudio = audio;

startStream();

}else{

audio.pause();

}

});


// ======================================
// STOP
// ======================================

stopBtn.addEventListener("click", ()=>{

stopStream();

});


// ======================================
// RESET UI
// ======================================

function resetUI(){

stopTimer();
stopFreezeMonitor();

container.classList.remove("playing");

playBtn.innerHTML = '<i class="fas fa-play"></i>';

updateStatus("OFFLINE");

}


// ======================================
// MUTE
// ======================================

muteBtn.addEventListener("click", ()=>{

audio.muted = !audio.muted;

localStorage.setItem("radioMuted", audio.muted);

updateMuteIcon();

});

function updateMuteIcon(){

muteBtn.innerHTML = audio.muted
? '<i class="fas fa-volume-mute"></i>'
: '<i class="fas fa-volume-up"></i>';

}


// ======================================
// VOLUMEN
// ======================================

volumeSlider.addEventListener("input", e=>{

audio.volume = e.target.value;

localStorage.setItem("radioVolume", e.target.value);

});


// ======================================
// INTERNET OFFLINE / ONLINE
// ======================================

window.addEventListener("offline", ()=>{

updateStatus("SIN INTERNET");

});

window.addEventListener("online", ()=>{

if(isPlaying){

updateStatus("RECUPERANDO");

reconnect();

}

});

});
