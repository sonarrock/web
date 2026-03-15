// ======================================
// SONAR ROCK - RADIO PLAYER PRO
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

const vuCanvas = document.getElementById("vu-meter");
const vuCtx = vuCanvas ? vuCanvas.getContext("2d") : null;


// ======================================
// VARIABLES
// ======================================

let isPlaying = false;
let reconnectAttempts = 0;
let reconnectTimer = null;
let freezeMonitor = null;
let timerInterval = null;
let seconds = 0;
let lastTime = 0;

let audioContext;
let analyser;
let source;
let dataArray;

const BASE_DELAY = 2000;
const MAX_DELAY = 15000;

window.globalActiveAudio = null;


// ======================================
// CONFIG AUDIO
// ======================================

audio.src = STREAM_URL;
audio.preload = "auto";
audio.crossOrigin = "anonymous";

audio.volume = parseFloat(localStorage.getItem("radioVolume")) || 1;
volumeSlider.value = audio.volume;

audio.muted = localStorage.getItem("radioMuted") === "true";

updateMuteIcon();
updateStatus("OFFLINE");

audio.load();


// ======================================
// STREAM WARM BUFFER (SOLO UNO)
// ======================================

setTimeout(()=>{

audio.muted = true;

audio.play().then(()=>{

audio.pause();
audio.currentTime = 0;

audio.muted = localStorage.getItem("radioMuted") === "true";

console.log("Stream precalentado");

}).catch(()=>{

console.log("Warmup bloqueado por navegador");

});

},1500);


// ======================================
// WEB AUDIO API
// ======================================

function initAudioAnalysis(){

audioContext = new (window.AudioContext || window.webkitAudioContext)();

source = audioContext.createMediaElementSource(audio);

analyser = audioContext.createAnalyser();

analyser.fftSize = 128;

dataArray = new Uint8Array(analyser.frequencyBinCount);

source.connect(analyser);
analyser.connect(audioContext.destination);

drawVUMeter();

}


// ======================================
// VU METER (SUAVE)
// ======================================

function drawVUMeter(){

requestAnimationFrame(drawVUMeter);

if(!analyser || !vuCtx) return;

analyser.getByteTimeDomainData(dataArray);

let sum = 0;

for(let i=0;i<dataArray.length;i++){

let v = (dataArray[i] - 128) / 128;
sum += v*v;

}

let rms = Math.sqrt(sum/dataArray.length);

let level = rms * vuCanvas.width * 0.8;

vuCtx.clearRect(0,0,vuCanvas.width,vuCanvas.height);

// fondo
vuCtx.fillStyle = "#111";
vuCtx.fillRect(0,0,vuCanvas.width,vuCanvas.height);

// barra suave naranja
vuCtx.fillStyle = "#ff6a00";
vuCtx.fillRect(0,0,level,vuCanvas.height);

}


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
// START STREAM
// ======================================

function startStream(){

audio.muted = false;
audio.volume = volumeSlider.value || 1;

audio.play().then(()=>{

isPlaying = true;

if(!audioContext){

initAudioAnalysis();

}

}).catch(err=>{

console.warn("Play bloqueado", err);

});

}


// ======================================
// STOP STREAM
// ======================================

function stopStream(){

audio.pause();

isPlaying = false;

resetUI();

}


// ======================================
// FREEZE MONITOR
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
// RECONEXIÓN
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

},delay);

}


// ======================================
// EVENTOS AUDIO
// ======================================

audio.addEventListener("loadstart", ()=>{

updateStatus("CONECTANDO");

});

audio.addEventListener("playing", ()=>{

updateStatus("LIVE SIGNAL");

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
