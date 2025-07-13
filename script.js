<!-- SCRIPT COMPLETO -->
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
        streamStatus.textContent = msg;
        streamStatus.style.color = error ? 'red' : '#0f0';
    }

    playBtn.addEventListener('click', function () {
        if (isPlaying) {
            audioPlayer.pause();
            playBtn.innerHTML = '<i class="fas fa-play"></i>';
            updateStatus('Pausado');
            stopVisualizer();
        } else {
            audioPlayer.load(); // fuerza carga
            setTimeout(() => {
                audioPlayer.play().then(() => {
                    playBtn.innerHTML = '<i class="fas fa-pause"></i>';
                    updateStatus('Reproduciendo');
                    startVisualizer();
                    isPlaying = true;
                }).catch((err) => {
                    console.error('Error en reproducción:', err);
                    updateStatus('Error al reproducir', true);
                    isPlaying = false;
                });
            }, 300);
        }
    });

    volumeSlider.addEventListener('input', function () {
        audioPlayer.volume = this.value / 100;
    });

    audioPlayer.addEventListener('error', function (e) {
        console.log('Audio error:', e);
        updateStatus('Error de stream', true);
        playBtn.innerHTML = '<i class="fas fa-play"></i>';
        isPlaying = false;
        stopVisualizer();
    });

    function startVisualizer() {
        stopVisualizer();
        visualizerInterval = setInterval(() => {
            bars.forEach(bar => {
                const height = Math.random() * 30 + 5;
                bar.style.height = height + 'px';
            });
        }, 100);
    }

    function stopVisualizer() {
        clearInterval(visualizerInterval);
        bars.forEach(bar => {
            bar.style.height = '5px';
        });
    }

    // Inicializar
    audioPlayer.volume = 1;
    updateStatus('Toca para reproducir');
});
</script>
