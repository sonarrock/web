document.addEventListener('DOMContentLoaded', function () {
    const playBtn = document.getElementById('playBtn');
    const audioPlayer = document.getElementById('audioPlayer');
    const volumeSlider = document.getElementById('volumeSlider');
    const streamStatus = document.getElementById('streamStatus');
    const bars = document.querySelectorAll('.bar');

    let isPlaying = false;
    let visualizerAnimationId = null;
    let audioContext = null;
    let analyser = null;
    let source = null;

    // Detectar si es un dispositivo móvil
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

    // Configurar el volumen inicial
    audioPlayer.volume = 1;

    // Configurar eventos del reproductor de audio
    audioPlayer.addEventListener('loadstart', () => {
        updateStatus('Cargando stream...');
    });

    audioPlayer.addEventListener('canplay', () => {
        updateStatus('Listo para reproducir');
    });

    audioPlayer.addEventListener('playing', () => {
        updateStatus('Reproduciendo', 'playing');
        isPlaying = true;
        playBtn.innerHTML = '<i class="fas fa-pause"></i>';
        startVisualizer();
    });

    audioPlayer.addEventListener('pause', () => {
        updateStatus('Pausado');
        isPlaying = false;
        playBtn.innerHTML = '<i class="fas fa-play"></i>';
        stopVisualizer();
    });

    audioPlayer.addEventListener('ended', () => {
        updateStatus('Stream finalizado');
        isPlaying = false;
        playBtn.innerHTML = '<i class="fas fa-play"></i>';
        stopVisualizer();
    });

    audioPlayer.addEventListener('error', (e) => {
        console.error('Error de audio:', e);
        updateStatus('Error de conexión', 'error');
        isPlaying = false;
        playBtn.innerHTML = '<i class="fas fa-play"></i>';
        stopVisualizer();
    });

    audioPlayer.addEventListener('stalled', () => {
        updateStatus('Reconectando...', 'loading');
    });

    audioPlayer.addEventListener('waiting', () => {
        updateStatus('Buffering...', 'loading');
    });

    // Función para actualizar el estado
    function updateStatus(message, type = '') {
        streamStatus.textContent = message;
        streamStatus.className = `stream-status ${type}`;
    }

    // Función para configurar AudioContext
    function setupAudioContext() {
        if (audioContext) return;

        try {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (!AudioContextClass) {
                console.warn('AudioContext no disponible');
                return;
            }

            audioContext = new AudioContextClass();
            analyser = audioContext.createAnalyser();
            analyser.fftSize = 64;
            analyser.smoothingTimeConstant = 0.8;

            source = audioContext.createMediaElementSource(audioPlayer);
            source.connect(analyser);
            analyser.connect(audioContext.destination);

            console.log('AudioContext configurado correctamente');
        } catch (error) {
            console.warn('Error configurando AudioContext:', error);
            audioContext = null;
        }
    }

    // Función para reproducir audio
    async function playAudio() {
        try {
            updateStatus('Iniciando reproducción...', 'loading');
            
            // Configurar AudioContext en la primera interacción del usuario
            if (!audioContext) {
                setupAudioContext();
            }

            // Reanudar AudioContext si está suspendido
            if (audioContext && audioContext.state === 'suspended') {
                await audioContext.resume();
            }

            // Para iOS, asegurar que el audio esté cargado
            if (isIOS && audioPlayer.readyState === 0) {
                audioPlayer.load();
                // Pequeña pausa para iOS
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            await audioPlayer.play();
            
        } catch (error) {
            console.error('Error al reproducir:', error);
            
            // Manejo específico de errores comunes
            if (error.name === 'NotAllowedError') {
                updateStatus('Toca para reproducir', 'error');
                if (isIOS) {
                    // En iOS, mostrar mensaje específico
                    updateStatus('Toca el botón para iniciar', 'error');
                }
            } else if (error.name === 'NotSupportedError') {
                updateStatus('Formato no soportado', 'error');
            } else {
                updateStatus('Error de reproducción', 'error');
            }
            
            isPlaying = false;
            playBtn.innerHTML = '<i class="fas fa-play"></i>';
        }
    }

    // Función para pausar audio
    function pauseAudio() {
        audioPlayer.pause();
    }

    // Event listener del botón de reproducción
    playBtn.addEventListener('click', async function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        if (isPlaying) {
            pauseAudio();
        } else {
            await playAudio();
        }
    });

    // Para dispositivos móviles, también manejar eventos touch
    if (isMobile) {
        playBtn.addEventListener('touchend', async function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            if (isPlaying) {
                pauseAudio();
            } else {
                await playAudio();
            }
        }, { passive: false });
    }

    // Control de volumen
    volumeSlider.addEventListener('input', function() {
        const volume = this.value / 100;
        audioPlayer.volume = volume;
    });

    // Visualizador de audio
    function startVisualizer() {
        stopVisualizer();

        if (analyser && audioContext) {
            // Usar Web Audio API para visualización real
            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);

            function updateBars() {
                if (!isPlaying) return;

                analyser.getByteFrequencyData(dataArray);
                
                bars.forEach((bar, i) => {
                    const value = dataArray[i] || 0;
                    const height = Math.max(5, (value / 255) * 35 + 5);
                    bar.style.height = height + 'px';
                });

                visualizerAnimationId = requestAnimationFrame(updateBars);
            }
            
            updateBars();
        } else {
            // Fallback: visualizador simulado
            function updateBarsSimulated() {
                if (!isPlaying) return;

                bars.forEach(bar => {
                    const height = Math.random() * 30 + 5;
                    bar.style.height = height + 'px';
                });

                visualizerAnimationId = requestAnimationFrame(updateBarsSimulated);
            }
            
            updateBarsSimulated();
        }
    }

    function stopVisualizer() {
        if (visualizerAnimationId) {
            cancelAnimationFrame(visualizerAnimationId);
            visualizerAnimationId = null;
        }
        
        bars.forEach(bar => {
            bar.style.height = '5px';
        });
    }

    // Manejo de visibilidad de la página para conservar batería
    document.addEventListener('visibilitychange', function() {
        if (document.hidden && audioContext && audioContext.state === 'running') {
            audioContext.suspend();
        } else if (!document.hidden && audioContext && audioContext.state === 'suspended' && isPlaying) {
            audioContext.resume();
        }
    });

    // Prevenir zoom en doble tap para móviles
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

        // Prevenir zoom general en doble tap
        document.addEventListener('touchend', function(event) {
            const now = (new Date()).getTime();
            if (now - lastTap <= 300) {
                event.preventDefault();
            }
            lastTap = now;
        }, false);
    }

    // Inicialización
    updateStatus('Listo para reproducir');
});
