<script>
document.addEventListener('DOMContentLoaded', function () {
    const playBtn = document.getElementById('playBtn');
    const audioPlayer = document.getElementById('audioPlayer');
    const volumeSlider = document.getElementById('volumeSlider');
    const streamStatus = document.getElementById('streamStatus');
    const bars = document.querySelectorAll('.bar');

    let isPlaying = false;
    let visualizerInterval;

    function updateStatus(msg, error = false) {
        if (streamStatus) {
            streamStatus.textContent = msg;
            streamStatus.style.color = error ? 'red' : '#0f0';
        }
    }

    function startVisualizer() {
        stopVisualizer();
        visualizerInterval = setInterval(() => {
            bars.forEach(bar => {
                const height = Math.random() * 30 + 5;
                bar.style.height = `${height}px`;
            });
        }, 120); // menos uso de CPU
    }

    function stopVisualizer() {
        clearInterval(visualizerInterval);
        bars.forEach(bar => {
            bar.style.height = '5px';
        });
    }

    if (playBtn && audioPlayer) {
        playBtn.addEventListener('click', function () {
            if (isPlaying) {
                audioPlayer.pause();
                playBtn.innerHTML = '<i class="fas fa-play"></i>';
                updateStatus('Pausado');
                stopVisualizer();
                isPlaying = false;
            } else {
                audioPlayer.play()
                    .then(() => {
                        playBtn.innerHTML = '<i class="fas fa-pause"></i>';
                        updateStatus('Reproduciendo');
                        startVisualizer();
                        isPlaying = true;
                    })
                    .catch((err) => {
                        console.error('Error en reproducción:', err);
                        updateStatus('Error al reproducir', true);
                        playBtn.innerHTML = '<i class="fas fa-play"></i>';
                        isPlaying = false;
                    });
            }
        });
    }

    if (volumeSlider && audioPlayer) {
        volumeSlider.addEventListener('input', function () {
            audioPlayer.volume = this.value / 100;
        });
    }

    if (audioPlayer) {
        audioPlayer.addEventListener('error', function (e) {
            console.error('Error de stream:', e);
            updateStatus('Error de stream', true);
            playBtn.innerHTML = '<i class="fas fa-play"></i>';
            stopVisualizer();
            isPlaying = false;
        });

        audioPlayer.volume = 1;
    }

    updateStatus('Toca para reproducir');
});
</script>
