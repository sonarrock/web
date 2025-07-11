document.addEventListener('DOMContentLoaded', () => {
    const playBtn = document.getElementById('playBtn');
    const audioPlayer = document.getElementById('audioPlayer');
    const volumeSlider = document.getElementById('volumeSlider');
    const bars = document.querySelectorAll('.bar');

    let isPlaying = false;
    let visualizerInterval;
    let retryCount = 0;
    const maxRetries = 3;

    // Configuración inicial
    audioPlayer.preload = 'none'; // importante para streams en vivo
    audioPlayer.crossOrigin = 'anonymous';
    audioPlayer.volume = 0.5;

    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    // Reproducción optimizada
    async function playAudio() {
        try {
            await audioPlayer.play();
            retryCount = 0;
            isPlaying = true;
            playBtn.innerHTML = '<i class="fas fa-pause"></i>';
            startVisualizer();
        } catch (error) {
            console.warn('Play failed:', error);
            if (retryCount < maxRetries) {
                retryCount++;
                reconnectAudio();
            } else {
                alert('No se pudo reproducir el audio. Verifica tu conexión.');
            }
        }
    }

    function pauseAudio() {
        audioPlayer.pause();
        isPlaying = false;
        playBtn.innerHTML = '<i class="fas fa-play"></i>';
        stopVisualizer();
    }

    function reconnectAudio() {
        setTimeout(() => {
            audioPlayer.pause();
            audioPlayer.src = audioPlayer.src;
            audioPlayer.load();
            playAudio();
        }, 1500);
    }

    playBtn.addEventListener('click', () => {
        if (isPlaying) {
            pauseAudio();
        } else {
            playAudio();
        }
    });

    // Control de volumen
    volumeSlider.addEventListener('input', () => {
        audioPlayer.volume = volumeSlider.value / 100;
    });

    // Indicadores de eventos
    audioPlayer.addEventListener('waiting', () => {
        console.log('Buffering...');
        if (audioPlayer.readyState < 3) reconnectAudio();
    });

    audioPlayer.addEventListener('error', (e) => {
        console.error('Audio error:', e);
        if (retryCount < maxRetries) reconnectAudio();
        else {
            isPlaying = false;
            playBtn.innerHTML = '<i class="fas fa-play"></i>';
            stopVisualizer();
        }
    });

    audioPlayer.addEventListener('ended', () => {
        console.log('Stream ended — trying to reconnect');
        if (isPlaying) reconnectAudio();
    });

    // Visualizador básico
    function startVisualizer() {
        clearInterval(visualizerInterval);
        const interval = isMobile ? 150 : 100;
        visualizerInterval = setInterval(() => {
            bars.forEach(bar => {
                bar.style.height = (Math.random() * 30 + 5) + 'px';
            });
        }, interval);
    }

    function stopVisualizer() {
        clearInterval(visualizerInterval);
        bars.forEach(bar => bar.style.height = '5px');
    }

    // Touch seguro en móviles
    if (isMobile) {
        playBtn.addEventListener('touchend', (e) => {
            const now = Date.now();
            if (now - (playBtn.lastTap || 0) < 300) {
                e.preventDefault();
                return false;
            }
            playBtn.lastTap = now;
        });

        // Prevención de doble zoom
        let lastTouchEnd = 0;
        document.addEventListener('touchend', (event) => {
            const now = Date.now();
            if (now - lastTouchEnd <= 300) {
                event.preventDefault();
            }
            lastTouchEnd = now;
        }, false);

        // Reanudar en focus
        window.addEventListener('focus', () => {
            if (isPlaying && audioPlayer.paused) {
                setTimeout(() => {
                    audioPlayer.play().catch(err => console.log('Resume on focus error:', err));
                }, 500);
            }
        });
    }

    // Smooth scroll navegación
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    // Animación en botones sociales
    document.querySelectorAll('.social-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            this.style.transform = 'scale(0.95)';
            setTimeout(() => { this.style.transform = ''; }, 150);
        });
    });

    // Animaciones con IntersectionObserver
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, {
        threshold: isMobile ? 0.05 : 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    document.querySelectorAll('.staff-member').forEach(member => {
        member.style.opacity = '0';
        member.style.transform = 'translateY(30px)';
        member.style.transition = 'all 0.6s ease';
        observer.observe(member);
    });

    // Visualizador Web Audio (solo en desktop)
    if (!isMobile && (typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined')) {
        try {
            const AudioContextClass = AudioContext || webkitAudioContext;
            const audioContext = new AudioContextClass();
            const analyser = audioContext.createAnalyser();
            const source = audioContext.createMediaElementSource(audioPlayer);

            source.connect(analyser);
            analyser.connect(audioContext.destination);

            analyser.fftSize = 64;
            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);

            function updateVisualizer() {
                if (isPlaying) {
                    analyser.getByteFrequencyData(dataArray);
                    bars.forEach((bar, index) => {
                        const value = dataArray[index] || 0;
                        const height = (value / 255) * 35 + 5;
                        bar.style.height = height + 'px';
                    });
                    requestAnimationFrame(updateVisualizer);
                }
            }

            audioPlayer.addEventListener('play', () => {
                if (audioContext.state === 'suspended') {
                    audioContext.resume();
                }
                updateVisualizer();
            });

        } catch (e) {
            console.warn('Web Audio API not supported, fallback visualizer in use');
        }
    }
});
</script>
