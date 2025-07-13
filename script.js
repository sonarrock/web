const audioPlayer = document.getElementById('audioPlayer');
const playBtn = document.getElementById('playBtn');
const volumeSlider = document.getElementById('volumeSlider');
let isPlaying = false;

// Accede a la manipulación de audio
function playAudio() {
    audioPlayer.play();
    isPlaying = true;
    playBtn.innerHTML = '<i class="fas fa-pause"></i>';
}

// Función para pausar audio
function pauseAudio() {
    audioPlayer.pause();
    isPlaying = false;
    playBtn.innerHTML = '<i class="fas fa-play"></i>';
}

// Play/Pause button event
playBtn.addEventListener('click', function() {
    if (isPlaying) {
        pauseAudio();
    } else {
        playAudio();
    }
});

// Volume control
volumeSlider.addEventListener('input', function() {
    audioPlayer.volume = this.value / 100;
});

// Set initial volume
audioPlayer.volume = 1.0;
volumeSlider.value = 100;
