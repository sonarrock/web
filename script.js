document.addEventListener('DOMContentLoaded', function () {
    const playBtn = document.getElementById('playBtn');
    const audioPlayer = document.getElementById('audioPlayer');
    const volumeSlider = document.getElementById('volumeSlider');
    const streamStatus = document.getElementById('streamStatus');
    const bars = document.querySelectorAll('.bar');

    let isPlaying = false;
    let visualizerInterval = null;

    // Detecta si es iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

    // Configura volumen
    audioPlayer.volume = 1;

    // Estado inicial
    if (streamStatus) {
        streamStatus.textContent = 'Toca para reproducir';
    }

    // Función para actualizar estado visual
    function updateStatus(message, type = '') {
        if (streamStatus) {
            streamStatus.textContent = message;
            streamStatus.className = `stream-status ${type}`;
        }
    }

    // Reproducción segura
    async function playAudio() {
        try {
            if (isIOS) {
                audioPlayer.load();
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            await audioPlayer.play();
            isPlaying = true;
            playBtn.innerHTML = '<i class="fas fa-pause"></i>';
            updateStatus('Reproduciendo...', 'playing');
            startVisualizer();
        } catch (e) {
            console.error('Error al reproducir:', e);
            updateStatus('Toca de nuevo para reproducir', 'error');
            isPlaying = false;
            playBtn.innerHTML = '<i class="fas fa-play"></i>';
        }
    }

    function pauseAudio() {
        audioPlayer.pause();
        isPlaying = false;
        playBtn.innerHTML = '<i class="fas fa-play"></i>';
        updateStatus('Pausado');
        stopVisualizer();
    }

    // Evento del botón
    playBtn.addEventListener('click', async () => {
        if (isPlaying) {
            pauseAudio();
        } else {
            await playAudio();
        }
    });

    // Volumen
    volumeSlider.addEventListener('input', () => {
        audioPlayer.volume = volumeSlider.value / 100;
    });

    // Visualizador básico
    function startVisualizer() {
        stopVisualizer();
        visualizerInterval = setInterval(() => {
            bars.forEach(bar => {
                const height = Math.random() * 30 + 5;
                bar.style.height = height + 'px';
            });
        }, 150);
    }

    function stopVisualizer() {
        if (visualizerInterval) {
            clearInterval(visualizerInterval);
            visualizerInterval = null;
        }
        bars.forEach(bar => {
            bar.style.height = '5px';
        });
    }

    // Opcional: limpiar AudioContext si quieres usarlo más adelante
});
