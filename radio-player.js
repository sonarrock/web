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

const canvas = document.getElementById("visualizer");
const ctx = canvas ? canvas.getContext("2d") : null;

const vuCanvas = document.getElementById("vu-meter");
const vuCtx = vuCanvas ? vuCanvas.getContext("2d") : null;

// VARIABLES
let isPlaying = false;
let reconnectAttempts = 0;
let reconnectTimer = null;
let freezeMonitor = null;
let timerInterval = null;
let seconds = 0;
let lastTime = 0;

const BASE_DELAY = 2000;
const MAX_DELAY = 15000;

window.globalActiveAudio = null;


// ======================================
// CONFIG AUDIO
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

// precarga inicial
audio.load();


// ======================================
// PRE-WARM DEL STREAM (buffer rápido)
// ======================================

setTimeout(()=>{

audio.muted = true;

audio.play().then(()=>{

audio.pause();
audio.currentTime = 0;

audio.muted = localStorage.getItem("radioMuted") === "true";

}).catch(()=>{});

},1200);


// ======================================
// WEB AUDIO API
// ======================================

let audioContext;
let analyser;
let source;
let dataArray;

function initAudioAnalysis(){

audioContext = new (window.AudioContext || window.webkitAudioContext)();

source = audioContext.createMediaElementSource(audio);

analyser = audioContext.createAnalyser();

analyser.fftSize = 256;

const bufferLength = analyser.frequencyBinCount;

dataArray = new Uint8Array(bufferLength);

source.connect(analyser);
analyser.connect(audioContext.destination);

drawVisualizer();
drawVUMeter();

}


// ======================================
// VISUALIZADOR
// ======================================

function drawVisualizer(){

requestAnimationFrame(drawVisualizer);

if(!analyser || !ctx) return;

analyser.getByteFrequencyData(dataArray);

ctx.fillStyle = "#000";
ctx.fillRect(0,0,canvas.width,canvas.height);

const barWidth = (canvas.width / dataArray.length) * 2;

let x = 0;

for(let i=0;i<dataArray.length;i++){

const barHeight = dataArray[i] * 0.7;

ctx.fillStyle = "#ff6a00";

ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

x += barWidth + 1;

}

}


// ======================================
// VU METER
// ======================================

function drawVUMeter(){

requestAnimationFrame(drawVUMeter);

if(!analyser || !vuCtx) return;

analyser.getByteTimeDomainData(dataArray);

let sum = 0;

for(let i=0;i<dataArray.length;i++){

let v = (dataArray[i] - 128) / 128;
sum += v * v;

}

let rms = Math.sqrt(sum / dataArray.length);

let level = rms * vuCanvas.width * 1.4;

vuCtx.clearRect(0,0,vuCanvas.width,vuCanvas.height);

vuCtx.fillStyle = "#111";
vuCtx.fillRect(0,0,vuCanvas.width,vuCanvas.height);

// verde
vuCtx.fillStyle = "#00ff66";
vuCtx.fillRect(0,0,level,vuCanvas.height);

// amarillo
if(level > vuCanvas.width * 0.6){

vuCtx.fillStyle = "#ffcc00";
vuCtx.fillRect(vuCanvas.width * 0.6,0,level - vuCanvas.width * 0.6,vuCanvas.height);

}

// rojo
if(level > vuCanvas.width * 0.85){

vuCtx.fillStyle = "#ff0033";
vuCtx.fillRect(vuCanvas.width * 0.85,0,level - vuCanvas.width * 0.85,vuCanvas.height);

}

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
