
document.addEventListener('DOMContentLoaded', function() {
    const playBtn = document.getElementById('playBtn');
    const audioPlayer = document.getElementById('audioPlayer');
    const volumeSlider = document.getElementById('volumeSlider');
    const bars = document.querySelectorAll('.bar');
    
    let isPlaying = false;
    let visualizerInterval;
    
    // Play/Pause functionality
    playBtn.addEventListener('click', function() {
        if (isPlaying) {
            audioPlayer.pause();
            playBtn.innerHTML = '<i class="fas fa-play"></i>';
            stopVisualizer();
        } else {
            audioPlayer.play().catch(e => {
                console.log('Error playing audio:', e);
                // If direct play fails, try loading the stream first
                audioPlayer.load();
                setTimeout(() => {
                    audioPlayer.play().catch(err => console.log('Play error:', err));
                }, 1000);
            });
            playBtn.innerHTML = '<i class="fas fa-pause"></i>';
            startVisualizer();
        }
        isPlaying = !isPlaying;
    });
    
    // Volume control
    volumeSlider.addEventListener('input', function() {
        audioPlayer.volume = this.value / 100;
    });
    
    // Audio events
    audioPlayer.addEventListener('loadstart', function() {
        console.log('Loading audio stream...');
    });
    
    audioPlayer.addEventListener('canplay', function() {
        console.log('Audio ready to play');
    });
    
    audioPlayer.addEventListener('error', function(e) {
        console.log('Audio error:', e);
        playBtn.innerHTML = '<i class="fas fa-play"></i>';
        isPlaying = false;
        stopVisualizer();
    });
    
    audioPlayer.addEventListener('ended', function() {
        playBtn.innerHTML = '<i class="fas fa-play"></i>';
        isPlaying = false;
        stopVisualizer();
    });
    
    // Visualizer functions
    function startVisualizer() {
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
    
    // Initialize volume
    audioPlayer.volume = 0.5;
    
    // Smooth scroll for navigation
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Add loading animation for social links
    document.querySelectorAll('.social-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = '';
            }, 150);
        });
    });
    
    // Intersection Observer for animations
    const observerOptions = {
        threshold: 0.1,
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
    
    // Observe staff members for scroll animations
    document.querySelectorAll('.staff-member').forEach(member => {
        member.style.opacity = '0';
        member.style.transform = 'translateY(30px)';
        member.style.transition = 'all 0.6s ease';
        observer.observe(member);
    });
    
    // Enhanced visualizer for when audio is actually playing
    if (typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined') {
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
            console.log('Web Audio API not supported, using fallback visualizer');
        }
    }
});
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
    let wakeLock = null;

    // Detectar dispositivo móvil
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    // Wake Lock para móviles que lo soporten
    async function requestWakeLock() {
        if ('wakeLock' in navigator) {
            try {
                wakeLock = await navigator.wakeLock.request('screen');
                wakeLock.addEventListener('release', () => {
                    console.log('Wake Lock released');
                });
                console.log('Wake Lock acquired');
            } catch (err) {
                console.log('Wake Lock request failed:', err);
            }
        }
    }

    async function releaseWakeLock() {
        if (wakeLock !== null) {
            try {
                await wakeLock.release();
                wakeLock = null;
            } catch (err) {
                console.log('Wake Lock release failed:', err);
            }
        }
    }

    // Visualizador básico
    function startVisualizer() {
        if (visualizerInterval) clearInterval(visualizerInterval);
        visualizerInterval = setInterval(() => {
            bars.forEach(bar => {
                const height = Math.random() * 30 + 5;
                bar.style.height = height + 'px';
            });
        }, 100);
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

    // Iconos
    function setPlayIcon() {
        playBtn.innerHTML = '<i class="fas fa-play"></i>';
    }
    function setPauseIcon() {
        playBtn.innerHTML = '<i class="fas fa-pause"></i>';
    }

    // Intentar reproducir audio con reintentos
    async function tryPlayAudio() {
        try {
            await audioPlayer.play();
            isPlaying = true;
            setPauseIcon();
            startVisualizer();
            retryCount = 0;
            if (isMobile) requestWakeLock();
        } catch (error) {
            console.log('Play attempt failed:', error);
            retryCount++;
            if (retryCount <= maxRetries) {
                setTimeout(() => {
                    audioPlayer.load();
                    tryPlayAudio();
                }, 1000);
            } else {
                isPlaying = false;
                setPlayIcon();
                stopVisualizer();
                alert('No se pudo reproducir el audio. Verifica tu conexión o permisos.');
            }
        }
    }

    // Pause audio y liberar recursos
    async function pauseAudio() {
        audioPlayer.pause();
        isPlaying = false;
        setPlayIcon();
        stopVisualizer();
        if (isMobile) releaseWakeLock();
    }

    // Botón play/pause
    playBtn.addEventListener('click', () => {
        if (isPlaying) {
            pauseAudio();
        } else {
            tryPlayAudio();
        }
    });

    // Actualizar estado al pausar (por cualquier causa)
    audioPlayer.addEventListener('pause', () => {
        isPlaying = false;
        setPlayIcon();
        stopVisualizer();
        if (isMobile) releaseWakeLock();
    });

    // Manejo errores
    audioPlayer.addEventListener('error', (e) => {
        console.log('Audio error:', e);
        isPlaying = false;
        setPlayIcon();
        stopVisualizer();
        if (isMobile) releaseWakeLock();
    });

    // Fin de reproducción
    audioPlayer.addEventListener('ended', () => {
        isPlaying = false;
        setPlayIcon();
        stopVisualizer();
        if (isMobile) releaseWakeLock();
    });

    // Control de volumen
    volumeSlider.addEventListener('input', function() {
        audioPlayer.volume = this.value / 100;
    });

    // Inicializa volumen (por si acaso)
    audioPlayer.volume = volumeSlider.value / 100 || 0.5;

    // Previene zoom por doble toque en móviles
    if (isMobile) {
        let lastTouchEnd = 0;
        document.addEventListener('touchend', (event) => {
            const now = (new Date()).getTime();
            if (now - lastTouchEnd <= 300) {
                event.preventDefault();
            }
            lastTouchEnd = now;
        }, false);
    }

    // Smooth scroll y animaciones (igual que antes)
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    document.querySelectorAll('.social-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            this.style.transform = 'scale(0.95)';
            setTimeout(() => { this.style.transform = ''; }, 150);
        });
    });

    const observerOptions = { threshold: 0.1, rootMargin: '0px 0px -50px 0px' };
    const observer = new IntersectionObserver(entries => {
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

    // Visualizador avanzado con Web Audio API
    if (typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined') {
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
                if (audioContext.state === 'suspended') audioContext.resume();
                updateVisualizer();
            });
        } catch (e) {
            console.log('Web Audio API no soportado, usando visualizador básico');
        }
    }
});
