document.addEventListener('DOMContentLoaded', function () {
    const playBtn = document.getElementById('playBtn');
    const audioPlayer = document.getElementById('audioPlayer');
    const volumeSlider = document.getElementById('volumeSlider');
    const bars = document.querySelectorAll('.bar');

    let isPlaying = false;
    let visualizerInterval = null;

    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    let audioContext = null;
    let analyser = null;

    // Inicializar volumen
    audioPlayer.volume = 1;

    // Función para iniciar reproducción con creación de AudioContext al vuelo
    async function playAudio() {
        try {
            if (!audioContext) {
                // Crear AudioContext solo aquí, tras la interacción
                const AudioContextClass = window.AudioContext || window.webkitAudioContext;
                audioContext = new AudioContextClass();
                analyser = audioContext.createAnalyser();
                const source = audioContext.createMediaElementSource(audioPlayer);
                source.connect(analyser);
                analyser.connect(audioContext.destination);
                analyser.fftSize = 64;
            }

            if (audioContext.state === 'suspended') {
                await audioContext.resume();
            }

            await audioPlayer.play();
            isPlaying = true;
            playBtn.innerHTML = '<i class="fas fa-pause"></i>';
            startVisualizer();
        } catch (error) {
            console.error('Error al reproducir:', error);
            alert('Por favor, toca el botón para iniciar la reproducción.');
        }
    }

    function pauseAudio() {
        audioPlayer.pause();
        isPlaying = false;
        playBtn.innerHTML = '<i class="fas fa-play"></i>';
        stopVisualizer();
    }

    playBtn.addEventListener('click', async function () {
        if (isPlaying) {
            pauseAudio();
        } else {
            await playAudio();
        }
    });

    volumeSlider.addEventListener('input', function () {
        audioPlayer.volume = this.value / 100;
    });

    function startVisualizer() {
        stopVisualizer();
        if (analyser) {
            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);

            function update() {
                if (!isPlaying) return;
                analyser.getByteFrequencyData(dataArray);
                bars.forEach((bar, i) => {
                    const val = dataArray[i] || 0;
                    const height = (val / 255) * 35 + 5;
                    bar.style.height = height + 'px';
                });
                requestAnimationFrame(update);
            }
            update();
        } else {
            visualizerInterval = setInterval(() => {
                if (isPlaying) {
                    bars.forEach(bar => {
                        const height = Math.random() * 30 + 5;
                        bar.style.height = height + 'px';
                    });
                }
            }, isMobile ? 150 : 100);
        }
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

    window.addEventListener('focus', () => {
        if (isPlaying && audioPlayer.paused) {
            playAudio();
        }
    });

    if (isMobile) {
        let lastTap = 0;
        playBtn.addEventListener('touchend', function (e) {
            const currentTime = new Date().getTime();
            const tapLength = currentTime - lastTap;
            if (tapLength < 300 && tapLength > 0) {
                e.preventDefault();
                return false;
            }
            lastTap = currentTime;
        });

        document.addEventListener('touchend', function (event) {
            const now = (new Date()).getTime();
            if (now - lastTap <= 300) {
                event.preventDefault();
            }
            lastTap = now;
        }, false);
    }
});
