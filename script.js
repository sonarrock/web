
document.addEventListener('DOMContentLoaded', function() {
    const playBtn = document.getElementById('playBtn');
    const audioPlayer = document.getElementById('audioPlayer');
    const volumeSlider = document.getElementById('volumeSlider');
    const bars = document.querySelectorAll('.bar');
    const listenersCountElement = document.getElementById('listenersCount');

    let isPlaying = false;
    let socket = null;

    // Inicializar Socket.IO si está disponible
    try {
        if (typeof io !== 'undefined') {
            socket = io();
            
            // Escuchar actualizaciones del contador de oyentes
            socket.on('listeners-update', (count) => {
                listenersCountElement.textContent = count;
            });
            
            // Manejar errores de conexión
            socket.on('connect_error', (error) => {
                console.log('Error de conexión Socket.IO:', error);
                // Mostrar contador estático si no hay conexión al servidor
                listenersCountElement.textContent = Math.floor(Math.random() * 50) + 10;
            });
        } else {
            // Si no hay Socket.IO disponible, usar contador simulado
            listenersCountElement.textContent = Math.floor(Math.random() * 50) + 10;
        }
    } catch (error) {
        console.log('Socket.IO no disponible:', error);
        // Usar contador simulado
        listenersCountElement.textContent = Math.floor(Math.random() * 50) + 10;
    }

    let visualizerInterval;
    let retryCount = 0;
    const maxRetries = 3;

    // Optimización para móviles - precargar el audio
    audioPlayer.preload = 'metadata';
    audioPlayer.crossOrigin = 'anonymous';

    // Detectar si es dispositivo móvil
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    // Configuración específica para móviles
    if (isMobile) {
        // Prevenir que el dispositivo se quede dormido
        let wakeLock = null;
        if ('wakeLock' in navigator) {
            navigator.wakeLock.request('screen').then(wl => {
                wakeLock = wl;
            }).catch(err => {
                console.log('Wake lock not supported');
            });
        }

        // Manejar interrupciones de audio en móviles
        audioPlayer.addEventListener('pause', function() {
            if (isPlaying) {
                // Intentar reanudar automáticamente después de una pausa no intencional
                setTimeout(() => {
                    if (isPlaying && audioPlayer.paused) {
                        audioPlayer.play().catch(e => console.log('Auto-resume failed:', e));
                    }
                }, 1000);
            }
        });

        // Manejar cambios de visibilidad de la página
        document.addEventListener('visibilitychange', function() {
            if (document.hidden) {
                // Página oculta, mantener audio
                if (isPlaying && !audioPlayer.paused) {
                    audioPlayer.volume = audioPlayer.volume; // Mantener volumen
                }
            } else {
                // Página visible, verificar estado del audio
                if (isPlaying && audioPlayer.paused) {
                    audioPlayer.play().catch(e => console.log('Resume on focus failed:', e));
                }
            }
        });
    }

    // Función mejorada para reproducir audio
    function playAudio() {
        const playPromise = audioPlayer.play();

        if (playPromise !== undefined) {
            playPromise.then(() => {
                console.log('Audio playing successfully');
                retryCount = 0;
                isPlaying = true;
                playBtn.innerHTML = '<i class="fas fa-pause"></i>';
                startVisualizer();
                
                // Notificar al servidor que el usuario está escuchando
                if (socket) {
                    socket.emit('start-listening');
                }
            }).catch(error => {
                console.log('Play failed:', error);

                // Reintentar en caso de error
                if (retryCount < maxRetries) {
                    retryCount++;
                    setTimeout(() => {
                        audioPlayer.load();
                        setTimeout(() => playAudio(), 500);
                    }, 1000);
                } else {
                    playBtn.innerHTML = '<i class="fas fa-play"></i>';
                    isPlaying = false;
                    stopVisualizer();
                    alert('No se pudo reproducir el audio. Verifica tu conexión.');
                }
            });
        }
    }

    // Función para pausar audio
    function pauseAudio() {
        audioPlayer.pause();
        isPlaying = false;
        playBtn.innerHTML = '<i class="fas fa-play"></i>';
        stopVisualizer();
        
        // Notificar al servidor que el usuario paró de escuchar
        if (socket) {
            socket.emit('stop-listening');
        }
    }

    // Play/Pause functionality mejorada
    playBtn.addEventListener('click', function() {
        if (isPlaying) {
            pauseAudio();
        } else {
            playAudio();
        }
    });

    // Doble toque para prevenir clicks accidentales en móviles
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

    // Volume control mejorado
    volumeSlider.addEventListener('input', function() {
        audioPlayer.volume = this.value / 100;
    });

    // Eventos de audio optimizados
    audioPlayer.addEventListener('loadstart', function() {
        console.log('Loading audio stream...');
    });

    audioPlayer.addEventListener('canplay', function() {
        console.log('Audio ready to play');
    });

    audioPlayer.addEventListener('waiting', function() {
        console.log('Audio buffering...');
        // Mostrar indicador de carga si es necesario
    });

    audioPlayer.addEventListener('error', function(e) {
        console.log('Audio error:', e);
        playBtn.innerHTML = '<i class="fas fa-play"></i>';
        isPlaying = false;
        stopVisualizer();

        // Reintentar automáticamente en caso de error
        if (retryCount < maxRetries) {
            retryCount++;
            setTimeout(() => {
                audioPlayer.load();
                if (isPlaying) {
                    setTimeout(() => playAudio(), 1000);
                }
            }, 2000);
        }
    });

    audioPlayer.addEventListener('ended', function() {
        // Para streams en vivo, esto normalmente no debería ocurrir
        // Pero si ocurre, intentar reconectar
        if (isPlaying) {
            setTimeout(() => {
                audioPlayer.load();
                playAudio();
            }, 1000);
        }
    });

    // Manejar interrupciones del sistema (llamadas, notificaciones)
    if (isMobile) {
        window.addEventListener('focus', function() {
            if (isPlaying && audioPlayer.paused) {
                setTimeout(() => {
                    audioPlayer.play().catch(e => console.log('Resume after focus:', e));
                }, 500);
            }
        });

        window.addEventListener('blur', function() {
            // No pausar automáticamente, dejar que el usuario controle
        });
    }

    // Visualizer functions optimizadas
    function startVisualizer() {
        if (visualizerInterval) clearInterval(visualizerInterval);

        // Reducir frecuencia de actualización en móviles para mejor rendimiento
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

    // Initialize volume al 100%
    audioPlayer.volume = 1.0;
    volumeSlider.value = 100;

    // Optimización para touch devices
    if (isMobile) {
        // Prevenir zoom en doble toque
        let lastTouchEnd = 0;
        document.addEventListener('touchend', function(event) {
            const now = (new Date()).getTime();
            if (now - lastTouchEnd <= 300) {
                event.preventDefault();
            }
            lastTouchEnd = now;
        }, false);
    }

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

    // Intersection Observer for animations (optimizado para móviles)
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

    // Observe staff members for scroll animations
    document.querySelectorAll('.staff-member').forEach(member => {
        member.style.opacity = '0';
        member.style.transform = 'translateY(30px)';
        member.style.transition = 'all 0.6s ease';
        observer.observe(member);
    });

    // Enhanced visualizer (solo para desktop para mejor rendimiento)
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
            console.log('Web Audio API not supported, using fallback visualizer');
        }
    }

    // Precarga el stream cuando la página esté lista
    setTimeout(() => {
        audioPlayer.load();
    }, 1000);

    // Simular contador de oyentes si no hay servidor
    if (!socket) {
        setInterval(() => {
            const currentCount = parseInt(listenersCountElement.textContent);
            const variation = Math.floor(Math.random() * 5) - 2; // Variación de -2 a +2
            const newCount = Math.max(5, currentCount + variation);
            listenersCountElement.textContent = newCount;
        }, 30000); // Actualizar cada 30 segundos
    }
});
