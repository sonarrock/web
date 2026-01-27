const audio = document.getElementById("radio-audio");
const playBtn = document.getElementById("playPauseBtn");
const stopBtn = document.getElementById("stop-btn");
const muteBtn = document.getElementById("mute-btn");
const volumeSlider = document.getElementById("volume");
const progressBar = document.getElementById("progress");
const currentTimeEl = document.getElementById("current-time");
const totalTimeEl = document.getElementById("total-time");
const statusText = document.getElementById("status-text");

let fakeSeconds = 0;
let fakeTimer = null;

/* ===============================
   PLAY / PAUSE
=============================== */
playBtn.addEventListener("click", () => {
  if (audio.paused) {
    audio.play();
    playBtn.innerHTML = "❚❚";
    statusText.textContent = "SONANDO EN VIVO";
    startFakeTimer();
  } else {
    audio.pause();
    playBtn.innerHTML = "▶";
    stopFakeTimer();
  }
});

/* ===============================
   STOP
=============================== */
stopBtn.addEventListener("click", () => {
  audio.pause();
  audio.currentTime = 0;
  fakeSeconds = 0;
  updateFakeUI();
  playBtn.innerHTML = "▶";
  statusText.textContent = "OFFLINE";
  stopFakeTimer();
});

/* ===============================
   MUTE
=============================== */
muteBtn.addEventListener("click", () => {
  audio.muted = !audio.muted;
  muteBtn.innerHTML = audio.muted ? "🔇" : "🔊";
});

/* ===============================
   VOLUME
=============================== */
volumeSlider.addEventListener("input", e => {
  audio.volume = e.target.value;
});

/* ===============================
   FAKE STREAM TIME
=============================== */
function startFakeTimer() {
  if (fakeTimer) return;
  fakeTimer = setInterval(() => {
    fakeSeconds++;
    updateFakeUI();
  }, 1000);
}

function stopFakeTimer() {
  clearInterval(fakeTimer);
  fakeTimer = null;
}

function updateFakeUI() {
  const minutes = String(Math.floor(fakeSeconds / 60)).padStart(2, "0");
  const seconds = String(fakeSeconds % 60).padStart(2, "0");

  currentTimeEl.textContent = `${minutes}:${seconds}`;
  totalTimeEl.textContent = "LIVE";

  progressBar.style.width = `${(fakeSeconds % 60) * 1.6}%`;
}
