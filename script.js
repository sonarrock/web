document.addEventListener('DOMContentLoaded', function () {
    const playBtn = document.getElementById('playBtn');
    const audioPlayer = document.getElementById('audioPlayer');
    const volumeSlider = document.getElementById('volumeSlider');
    const streamStatus = document.getElementById('streamStatus');
    const bars = document.querySelectorAll('.bar');

    let isPlaying = false;
    let visualizerInterval = null;
    let audioContext = null;
    let analyser = null;
    let source = null;

    // Detectar dispositivo móvil e iOS
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

    console.log('Dispositivo detectado:', isIOS ? 'iOS' : isMobile ? 'Móvil' : 'Desktop');

    // Configurar volumen inicial
    audioPlayer.volume = 1;

    // Función para actualizar estado
    function updateStatus(message, type = '') {
        streamStatus.textContent = message;
        streamStatus.className = `stream-status ${type}`;
        console.log('Estado:', message);
    }

    // Configurar AudioContext - Versión iOS optimizada
    function setupAudioContext() {
        if (audioContext) return;

        try {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
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

    // Función de reproducción simplificada para iOS
    async function playAudio() {
        try {
            updateStatus('Iniciando reproducción...', 'loading');

            // Configurar AudioContext en primera interacción
            if (!audioContext) {
                setupAudioContext();
            }

            // Reanudar AudioContext si está suspendido
            if (audioContext && audioContext.state === 'suspended') {
                await audioContext.resume();
            }

            // Para iOS: forzar carga y pausa antes de reproducir
            if (isIOS) {
                audioPlayer.load();
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            // Reproducir con manejo de promesa
            await audioPlayer.play();
            
        } catch (error) {
            console.error('Error de reproducción:', error);
            
            if (error.name === 'NotAllowedError') {
                updateStatus('Toca para permitir reproducción', 'error');
            } else if (error.name === 'NotSupportedError') {
                updateStatus('Stream no compatible', 'error');
            } else if (error.name === 'AbortError') {
                updateStatus('Reproducción interrumpida', 'error');
            } else {
                updateStatus('Error de conexión', 'error');
            }
            
            isPlaying = false;
            playBtn.innerHTML = '<i class="fas fa-play"></i>';
        }
    }

    function pauseAudio() {
        audioPlayer.pause();
    }

    // Eventos del audio player
    audioPlayer.addEventListener('loadstart', () => {
        updateStatus('Conectando...');
    });

    audioPlayer.addEventListener('loadedmetadata', () => {
        updateStatus('Stream cargado');
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
        updateStatus('Stream terminado');
        isPlaying = false;
        playBtn.innerHTML = '<i class="fas fa-play"></i>';
        stopVisualizer();
    });

    audioPlayer.addEventListener('error', (e) => {
        console.error('Error de audio:', e);
        updateStatus('Error de stream', 'error');
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

    // Botón de reproducción con manejo táctil
    playBtn.addEventListener('click', async function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        console.log('Botón presionado, estado actual:', isPlaying);
        
        if (isPlaying) {
            pauseAudio();
        } else {
            await playAudio();
        }
    });

    // Manejo especial para dispositivos táctiles
    if (isMobile) {
        playBtn.addEventListener('touchstart', function(e) {
            e.preventDefault();
        }, { passive: false });

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
        audioPlayer.volume = this.value / 100;
    });

    // Visualizador
    function startVisualizer() {
        stopVisualizer();
        
        if (analyser && audioContext) {
            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);

            function updateBars() {
                if (!isPlaying) return;
                
                analyser.getByteFrequencyData(dataArray);
                bars.forEach((bar, i) => {
                    const val = dataArray[i] || 0;
                    const height = (val / 255) * 35 + 5;
                    bar.style.height = height + 'px';
                });
                requestAnimationFrame(updateBars);
            }
            updateBars();
        } else {
            // Visualizador básico
            visualizerInterval = setInterval(() => {
                if (isPlaying) {
                    bars.forEach(bar => {
                        const height = Math.random() * 30 + 5;
                        bar.style.height = height + 'px';
                    });
                }
            }, 150);
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

    // Prevenir zoom en doble tap en móviles
    if (isMobile) {
        let lastTap = 0;
        document.addEventListener('touchend', function(event) {
            const now = (new Date()).getTime();
            if (now - lastTap <= 300) {
                event.preventDefault();
            }
            lastTap = now;
        }, false);
    }

    // Manejo de visibilidad para ahorrar batería
    document.addEventListener('visibilitychange', function() {
        if (document.hidden && audioContext && audioContext.state === 'running') {
            audioContext.suspend();
        } else if (!document.hidden && audioContext && audioContext.state === 'suspended' && isPlaying) {
            audioContext.resume();
        }
    });

    // Estado inicial
    updateStatus('Toca para reproducir');
    console.log('Reproductor inicializado');
});
