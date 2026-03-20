document.addEventListener("DOMContentLoaded", () => {
    const STREAM_URL = "https://stream.zeno.fm/ezq3fcuf5ehvv";
    
    const audio = document.getElementById("radio-audio");
    const playBtn = document.getElementById("playPauseBtn");
    const statusText = document.getElementById("status-text");
    const timerEl = document.getElementById("timer");
    const volumeSlider = document.getElementById("volume");
    const container = document.querySelector(".player-container");

    let isPlaying = false;
    let timerInterval = null;
    let seconds = 0;
    let freezeMonitor = null;
    let audioContext, analyser, source, dataArray;

    // Configuración Inicial
    audio.preload = "none"; // Mejor para móviles, carga solo al dar play
    audio.crossOrigin = "anonymous";

    // 1. FUNCIÓN DE REPRODUCCIÓN (La más importante)
    async function togglePlay() {
        if (!isPlaying) {
            // Reset de URL para saltar caché y evitar desfase (Live real)
            audio.src = STREAM_URL + "?cache=" + Date.now();
            
            try {
                await audio.play();
                isPlaying = true;
                updateUI(true);
                startTimer();
                startFreezeMonitor();
                
                // Activar Web Audio API para visualizador
                if (!audioContext) {
                    initAudioAnalysis();
                } else if (audioContext.state === 'suspended') {
                    audioContext.resume();
                }
            } catch (err) {
                console.error("Error al reproducir:", err);
                stopStream();
            }
        } else {
            stopStream();
        }
    }

    function stopStream() {
        audio.pause();
        audio.src = ""; // Corta la descarga de datos inmediatamente
        isPlaying = false;
        updateUI(false);
        stopTimer();
        stopFreezeMonitor();
    }

    // 2. MONITOR DE CONGELAMIENTO (Watchdog)
    function startFreezeMonitor() {
        let lastPos = 0;
        clearInterval(freezeMonitor);
        freezeMonitor = setInterval(() => {
            if (isPlaying && !audio.paused) {
                if (audio.currentTime === lastPos) {
                    console.warn("Stream congelado, reconectando...");
                    reconnect();
                }
                lastPos = audio.currentTime;
            }
        }, 8000);
    }

    function reconnect() {
        if (!isPlaying) return;
        statusText.textContent = "RECONECTANDO...";
        audio.src = STREAM_URL + "?retry=" + Date.now();
        audio.play().catch(() => {});
    }

    // 3. TIMER Y UI
    function startTimer() {
        clearInterval(timerInterval);
        timerInterval = setInterval(() => {
            seconds++;
            const m = String(Math.floor(seconds / 60)).padStart(2, "0");
            const s = String(seconds % 60).padStart(2, "0");
            timerEl.textContent = `${m}:${s}`;
        }, 1000);
    }

    function stopTimer() {
        clearInterval(timerInterval);
        seconds = 0;
        timerEl.textContent = "00:00";
    }

    function updateUI(playing) {
        if (playing) {
            statusText.textContent = "LIVE SIGNAL";
            container.classList.add("playing");
            playBtn.innerHTML = '<i class="fas fa-pause"></i>';
        } else {
            statusText.textContent = "OFFLINE";
            container.classList.remove("playing");
            playBtn.innerHTML = '<i class="fas fa-play"></i>';
        }
    }

    // EVENTOS
    playBtn.addEventListener("click", togglePlay);

    // Manejo de errores de red
    audio.addEventListener("error", () => {
        if (isPlaying) reconnect();
    });

    audio.addEventListener("waiting", () => {
        if (isPlaying) statusText.textContent = "BUFFERING...";
    });

    audio.addEventListener("playing", () => {
        if (isPlaying) statusText.textContent = "LIVE SIGNAL";
    });

    // Reset si el usuario cambia de pestaña o el sistema mata el proceso (Android/iOS)
    window.addEventListener("online", () => {
        if (isPlaying) reconnect();
    });
});
