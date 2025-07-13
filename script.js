
document.addEventListener('DOMContentLoaded', function() {
    const playBtn = document.getElementById('playBtn');
    const audioPlayer = document.getElementById('audioPlayer');
    const volumeSlider = document.getElementById('volumeSlider');
    const bars = document.querySelectorAll('.bar');
    const listenersCountElement = document.getElementById('listenersCount');

    let isPlaying = false;
    let socket = null;

    // Inicializar contador de oyentes (simulado)
    let currentListeners = Math.floor(Math.random() * 50) + 15;
    listenersCountElement.textContent = currentListeners;
    
    // Intentar inicializar Socket.IO si está disponible
    try {
        if (typeof io !== 'undefined') {
            socket = io();
            
            socket.on('listeners-update', (count) => {
                listenersCountElement.textContent = count;
                currentListeners = count;
            });
            
            socket.on('connect_error', (error) => {
                console.log('Error de conexión Socket.IO:', error);
            });
        }
    } catch (error) {
        console.log('Socket.IO no disponible:', error);
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
                
                // Notificar al servidor si está disponible
                if (socket && socket.connected) {
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
        
        // Notificar al servidor si está disponible
        if (socket && socket.connected) {
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

    // Contador simulado con variaciones realistas
    setInterval(() => {
        if (!socket) {
            const hour = new Date().getHours();
            let baseChange = 0;
            
            // Más oyentes en horarios pico
            if (hour >= 7 && hour <= 9) baseChange = 2; // Mañana
            else if (hour >= 12 && hour <= 14) baseChange = 1; // Mediodía
            else if (hour >= 18 && hour <= 22) baseChange = 3; // Noche
            else if (hour >= 23 || hour <= 6) baseChange = -2; // Madrugada
            
            const variation = Math.floor(Math.random() * 7) - 3; // -3 a +3
            const newCount = Math.max(8, Math.min(120, currentListeners + baseChange + variation));
            currentListeners = newCount;
            listenersCountElement.textContent = newCount;
        }
    }, 15000); // Actualizar cada 15 segundos

    // Sistema de información en tiempo real
    const songTitleElement = document.getElementById('songTitle');
    const artistNameElement = document.getElementById('artistName');
    const programStatusElement = document.getElementById('programStatus');
    const liveIndicator = document.getElementById('liveIndicator');

    // Base de datos simulada de canciones
    const songDatabase = [
        { title: "Bohemian Rhapsody", artist: "Queen" },
        { title: "Stairway to Heaven", artist: "Led Zeppelin" },
        { title: "Hotel California", artist: "Eagles" },
        { title: "Sweet Child O' Mine", artist: "Guns N' Roses" },
        { title: "Smells Like Teen Spirit", artist: "Nirvana" },
        { title: "Back in Black", artist: "AC/DC" },
        { title: "Paranoid", artist: "Black Sabbath" },
        { title: "Master of Puppets", artist: "Metallica" },
        { title: "The Wall", artist: "Pink Floyd" },
        { title: "November Rain", artist: "Guns N' Roses" },
        { title: "Enter Sandman", artist: "Metallica" },
        { title: "Thunderstruck", artist: "AC/DC" },
        { title: "More Than a Feeling", artist: "Boston" },
        { title: "Don't Stop Believin'", artist: "Journey" },
        { title: "Living on a Prayer", artist: "Bon Jovi" }
    ];

    const programs = [
        { name: "ROCK MATUTINO", time: "06:00 - 10:00" },
        { name: "CLÁSICOS DEL ROCK", time: "10:00 - 14:00" },
        { name: "METAL ZONE", time: "14:00 - 18:00" },
        { name: "ROCK ALTERNATIVO", time: "18:00 - 22:00" },
        { name: "NOCHE DE LEYENDAS", time: "22:00 - 02:00" },
        { name: "MADRUGADA ROCK", time: "02:00 - 06:00" }
    ];

    // Intentar obtener metadatos reales del stream
    async function fetchStreamMetadata() {
        try {
            // Intentar obtener metadatos de Zeno.FM
            const response = await fetch('https://public.radio.co/stations/sf0d3f6b0c/status', {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.current_track) {
                    return {
                        title: data.current_track.title || 'Título no disponible',
                        artist: data.current_track.artist || 'Artista no disponible',
                        isLive: data.status === 'live'
                    };
                }
            }
        } catch (error) {
            console.log('No se pudieron obtener metadatos reales:', error);
        }
        
        // Fallback a datos simulados más realistas
        return null;
    }

    function updateNowPlaying() {
        fetchStreamMetadata().then(realData => {
            const currentHour = new Date().getHours();
            
            // Determinar el programa actual basado en la hora
            let currentProgram;
            if (currentHour >= 6 && currentHour < 10) currentProgram = programs[0];
            else if (currentHour >= 10 && currentHour < 14) currentProgram = programs[1];
            else if (currentHour >= 14 && currentHour < 18) currentProgram = programs[2];
            else if (currentHour >= 18 && currentHour < 22) currentProgram = programs[3];
            else if (currentHour >= 22 || currentHour < 2) currentProgram = programs[4];
            else currentProgram = programs[5];

            let songInfo, isLive;
            
            if (realData) {
                // Usar datos reales si están disponibles
                songInfo = realData;
                isLive = realData.isLive;
            } else {
                // Usar datos simulados más inteligentes
                const randomSong = songDatabase[Math.floor(Math.random() * songDatabase.length)];
                songInfo = {
                    title: randomSong.title,
                    artist: randomSong.artist
                };
                
                // Determinar si hay programa en vivo basado en horarios reales
                const isBusinessHour = (currentHour >= 6 && currentHour <= 23);
                isLive = isBusinessHour && Math.random() > 0.4; // 60% en horario comercial
            }

            // Actualizar información con animaciones suaves
            songTitleElement.style.opacity = '0';
            artistNameElement.style.opacity = '0';
            
            setTimeout(() => {
                songTitleElement.textContent = songInfo.title;
                artistNameElement.textContent = songInfo.artist;
                songTitleElement.style.opacity = '1';
                artistNameElement.style.opacity = '1';
            }, 300);

            // Actualizar estado del programa
            if (isLive) {
                programStatusElement.textContent = currentProgram.name;
                liveIndicator.style.display = 'flex';
                liveIndicator.style.background = 'rgba(255, 0, 0, 0.1)';
                liveIndicator.style.borderColor = '#ff0000';
            } else {
                programStatusElement.textContent = 'MÚSICA AUTOMÁTICA';
                liveIndicator.style.display = 'flex';
                liveIndicator.style.background = 'rgba(255, 165, 0, 0.1)';
                liveIndicator.style.borderColor = '#ffa500';
            }
        });
    }

    // Inicializar con información básica
    songTitleElement.textContent = "Conectando con el stream...";
    artistNameElement.textContent = "Obteniendo información...";
    programStatusElement.textContent = "CARGANDO";

    // Actualizar información cada 20-40 segundos
    setTimeout(() => {
        updateNowPlaying();
        setInterval(updateNowPlaying, Math.random() * 20000 + 20000);
    }, 2000); // Esperar 2 segundos antes de la primera actualización

    // Sistema de partículas
    function createParticle() {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        // Tipos de partículas aleatorias
        const types = ['small', 'medium', 'large'];
        const type = types[Math.floor(Math.random() * types.length)];
        particle.classList.add(type);
        
        // Posición aleatoria
        particle.style.left = Math.random() * 100 + '%';
        
        // Duración aleatoria
        const duration = Math.random() * 10 + 8; // 8-18 segundos
        particle.style.animationDuration = duration + 's';
        
        // Delay aleatorio
        particle.style.animationDelay = Math.random() * 2 + 's';
        
        document.getElementById('particles-container').appendChild(particle);
        
        // Remover partícula después de la animación
        setTimeout(() => {
            if (particle.parentNode) {
                particle.parentNode.removeChild(particle);
            }
        }, (duration + 2) * 1000);
    }

    // Crear partículas continuamente (menos en móviles para mejor rendimiento)
    const particleInterval = isMobile ? 3000 : 1500;
    setInterval(createParticle, particleInterval);

    // Crear partículas iniciales
    for (let i = 0; i < (isMobile ? 5 : 10); i++) {
        setTimeout(createParticle, i * 500);
    }

    // Efectos dinámicos en el reproductor cuando está activo
    function enhanceVisualizerWhenPlaying() {
        if (isPlaying) {
            bars.forEach((bar, index) => {
                const baseHeight = Math.random() * 30 + 5;
                const glowIntensity = Math.random() * 0.5 + 0.3;
                bar.style.height = baseHeight + 'px';
                bar.style.boxShadow = `0 0 ${5 + glowIntensity * 10}px rgba(255, 102, 0, ${glowIntensity})`;
                
                // Efectos de color dinámicos
                if (Math.random() > 0.7) {
                    bar.style.background = 'linear-gradient(to top, #ff6600, #ffffff, #ffaa66)';
                } else {
                    bar.style.background = 'linear-gradient(to top, #ff6600, #ffaa66, #ffffff)';
                }
            });
        }
    }

    // Mejorar el visualizador con efectos dinámicos
    if (visualizerInterval) {
        clearInterval(visualizerInterval);
    }

    function startEnhancedVisualizer() {
        if (visualizerInterval) clearInterval(visualizerInterval);

        const updateInterval = isMobile ? 150 : 100;

        visualizerInterval = setInterval(() => {
            if (isPlaying) {
                enhanceVisualizerWhenPlaying();
            }
        }, updateInterval);
    }

    // Reemplazar la función original del visualizador
    window.startVisualizer = startEnhancedVisualizer;
});

// Efectos de interacción mejorados
document.addEventListener('mousemove', function(e) {
    if (!isMobile) {
        const particles = document.querySelectorAll('.particle');
        const mouseX = e.clientX / window.innerWidth;
        const mouseY = e.clientY / window.innerHeight;
        
        particles.forEach((particle, index) => {
            if (index % 3 === 0) { // Solo afectar algunas partículas para mejor rendimiento
                const offsetX = (mouseX - 0.5) * 10;
                const offsetY = (mouseY - 0.5) * 10;
                particle.style.transform += ` translate(${offsetX}px, ${offsetY}px)`;
            }
        });
    }
});
