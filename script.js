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
        }, 120);
    }

    function stopVisualizer() {
        clearInterval(visualizerInterval);
        bars.forEach(bar => {
            bar.style.height = '5px';
        });
    }

    function playStream() {
        updateStatus('Cargando...', false);
        audioPlayer.load(); // fuerza recarga
        audioPlayer.play()
            .then(() => {
                isPlaying = true;
                playBtn.innerHTML = '<i class="fas fa-pause"></i>';
                updateStatus('Reproduciendo');
                startVisualizer();
            })
            .catch((err) => {
                console.error('Error en reproducción:', err);
                updateStatus('Error al reproducir', true);
                playBtn.innerHTML = '<i class="fas fa-play"></i>';
                isPlaying = false;
                stopVisualizer();
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
                playStream();
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

        audioPlayer.addEventListener('waiting', function () {
            updateStatus('Cargando...', false);
        });

        audioPlayer.addEventListener('playing', function () {
            updateStatus('Reproduciendo');
        });

        audioPlayer.addEventListener('pause', function () {
            if (isPlaying) {
                updateStatus('Pausado');
            }
        });

        audioPlayer.volume = 1;
        audioPlayer.preload = 'none'; // optimiza carga
    }

    updateStatus('Listo');
});
</script>
