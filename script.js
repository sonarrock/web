document.addEventListener('DOMContentLoaded', function () {
    const playBtn = document.getElementById('playBtn');
    const audioPlayer = document.getElementById('audioPlayer');
    const volumeSlider = document.getElementById('volumeSlider');
    const bars = document.querySelectorAll('.bar');

    let isPlaying = false;
    let visualizerInterval = null;

    // Detectar si es móvil
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    // Asegurar que el audio se pueda reproducir en móviles
    audioPlayer.crossOrigin = "anonymous";

    // Inicializar volumen
    audioPlayer.volume = 1;

    // Reproducción segura
    async function playAudio() {
        try {
            await audioPlayer.play();
            isPlaying = true;
            playBtn.innerHTML = '<i class="fas fa-pause"></i>';
            startVisualizer();
        } catch (error) {
            console.error("Error al reproducir:", error);
            alert("Presiona el botón para iniciar la transmisión.");
        }
    }

    // Pausar
    function pauseAudio() {
        audioPlayer.pause();
        isPlaying = false;
        playBtn.innerHTML = '<i class="fas fa-play"></i>';
        stopVisualizer();
    }

    // Alternar reproducción
    playBtn.addEventListener('click', function () {
        if (isPlaying) {
            pauseAudio();
        } else {
            playAudio();
        }
    });

    // Control de volumen
    volumeSlider.addEventListener('input', function () {
        audioPlayer.volume = this.value / 100;
    });

    // Visualizador simple
    function startVisualizer() {
        stopVisualizer();
        visualizerInterval = setInterval(() => {
            if (isPlaying) {
                bars.forEach(bar => {
                    const height = Math.random() * 30 + 5;
                    bar.style.height = height + 'px';
                });
            }
        }, isMobile ? 150 : 100);
    }

    function stopVisualizer() {
        clearInterval(visualizerInterval);
        bars.forEach(bar => {
            bar.style.height = '5px';
        });
    }

    // Recuperar audio al volver a enfocar la ventana
    window.addEventListener('focus', () => {
        if (isPlaying && audioPlayer.paused) {
            playAudio();
        }
    });

    // Prevenir doble toque accidental en móviles
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

        // Prevenir zoom con doble tap
        document.addEventListener('touchend', function (event) {
            const now = (new Date()).getTime();
            if (now - lastTap <= 300) {
                event.preventDefault();
            }
            lastTap = now;
        }, false);
    }

    // Animaciones con Intersection Observer (opcional)
    const observerOptions = {
        threshold: isMobile ? 0.05 : 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    document.querySelectorAll('.staff-member').forEach(member => {
        member.style.opacity = '0';
        member.style.transform = 'translateY(30px)';
        member.style.transition = 'all 0.6s ease';
        observer.observe(member);
    });

    // Animación al hacer clic en botones sociales
    document.querySelectorAll('.social-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = '';
            }, 150);
        });
    });

    // Scroll suave para anclas
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    // Visualizador mejorado solo para escritorio
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
            console.log('AudioContext no compatible. Visualizador básico activo.');
        }
    }
});
