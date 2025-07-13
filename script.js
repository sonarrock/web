document.addEventListener('DOMContentLoaded', function() {
    const playBtn = document.getElementById('playBtn');
    const audioPlayer = document.getElementById('audioPlayer');
    const volumeSlider = document.getElementById('volumeSlider');
    const bars = document.querySelectorAll('.bar');

    if (!playBtn || !audioPlayer) return;

    let isPlaying = false;
    let visualizerInterval = null;
    let retryCount = 0;
    const maxRetries = 3;

    // Precarga el audio y configura para CORS si aplica
    audioPlayer.preload = 'metadata';
    audioPlayer.crossOrigin = 'anonymous';

    // Detectar dispositivo móvil
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    // Prevención doble toque en móviles para evitar clicks accidentales
    if (isMobile) {
        let lastTap = 0;
        playBtn.addEventListener('touchend', function(e) {
            const currentTime = new Date().getTime();
            const tapLength = currentTime - lastTap;
            if (tapLength < 300 && tapLength > 0) {
                e.preventDefault();
                return false;
            }
            lastTap = currentTime;
        });
    }

    // Funciones visualizer
    function startVisualizer() {
        if (visualizerInterval) clearInterval(visualizerInterval);
        const updateInterval = isMobile ? 150 : 100;
        visualizerInterval = setInterval(() => {
            if (isPlaying) {
                bars.forEach(bar => {
                    const height = Math.random() * 30 + 5;
                    bar.style.height = height + 'px';
                });
            }
        }, updateInterval);
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

    // Play/Pause funciones
    function playAudio() {
        const playPromise = audioPlayer.play();

        if (playPromise !== undefined) {
            playPromise.then(() => {
                retryCount = 0;
                isPlaying = true;
                playBtn.querySelector('i').classList.replace('fa-play', 'fa-pause');
                startVisualizer();
            }).catch(error => {
                if (retryCount < maxRetries) {
                    retryCount++;
                    setTimeout(() => {
                        audioPlayer.load();
                        setTimeout(playAudio, 500);
                    }, 1000);
                } else {
                    isPlaying = false;
                    playBtn.querySelector('i').classList.replace('fa-pause', 'fa-play');
                    stopVisualizer();
                    alert('No se pudo reproducir el audio. Verifica tu conexión.');
                }
            });
        }
    }

    function pauseAudio() {
        audioPlayer.pause();
        isPlaying = false;
        playBtn.querySelector('i').classList.replace('fa-pause', 'fa-play');
        stopVisualizer();
    }

    // Botón play/pause
    playBtn.addEventListener('click', function() {
        if (isPlaying) {
            pauseAudio();
        } else {
            playAudio();
        }
    });

    // Control de volumen
    volumeSlider.addEventListener('input', function() {
        audioPlayer.volume = this.value / 100;
    });

    // Eventos del audio para manejo de estado
    audioPlayer.addEventListener('error', (e) => {
        isPlaying = false;
        playBtn.querySelector('i').classList.replace('fa-pause', 'fa-play');
        stopVisualizer();

        if (retryCount < maxRetries) {
            retryCount++;
            setTimeout(() => {
                audioPlayer.load();
                if (isPlaying) {
                    setTimeout(playAudio, 1000);
                }
            }, 2000);
        }
    });

    audioPlayer.addEventListener('ended', () => {
        if (isPlaying) {
            setTimeout(() => {
                audioPlayer.load();
                playAudio();
            }, 1000);
        }
    });

    // WakeLock y optimizaciones para móviles
    if (isMobile && 'wakeLock' in navigator) {
        navigator.wakeLock.request('screen').catch(() => {
            console.log('Wake lock not supported or denied');
        });
    }

    // Prevent zoom doble toque en móviles
    if (isMobile) {
        let lastTouchEnd = 0;
        document.addEventListener('touchend', function(event) {
            const now = (new Date()).getTime();
            if (now - lastTouchEnd <= 300) {
                event.preventDefault();
            }
            lastTouchEnd = now;
        }, false);
    }

    // Inicializa volumen y slider
    audioPlayer.volume = 0.5;
    volumeSlider.value = 50;

    // Carga el stream al iniciar
    setTimeout(() => audioPlayer.load(), 1000);
});
