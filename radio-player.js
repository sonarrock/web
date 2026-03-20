document.addEventListener("DOMContentLoaded", () => {
    const STREAM_URL = "https://stream.zeno.fm";
    const audio = document.getElementById("radio-audio");
    const playBtn = document.getElementById("playPauseBtn");
    const stopBtn = document.getElementById("stop-btn");
    const statusText = document.getElementById("status-text");
    const timerEl = document.getElementById("timer");

    let isPlaying = false;
    let timerInterval = null;
    let seconds = 0;

    // 1. FUNCIÓN PRINCIPAL DE PLAY/PAUSE
    async function togglePlay() {
        if (!isPlaying) {
            // REGLA DE ORO: Asignar el SRC justo antes del PLAY para evitar bloqueos y desfase
            audio.src = STREAM_URL + "?t=" + Date.now(); 
            
            try {
                await audio.play();
                isPlaying = true;
                startUI();
                setupMediaSession(); // Para ver controles en pantalla de bloqueo
            } catch (err) {
                console.error("Error al iniciar:", err);
                resetUI();
            }
        } else {
            stopStream();
        }
    }

    function stopStream() {
        audio.pause();
        audio.src = ""; // Cortamos la descarga de datos por completo
        audio.load();   // Limpiamos el buffer
        isPlaying = false;
        resetUI();
    }

    // 2. GESTIÓN DE INTERFAZ Y TIEMPO
    function startUI() {
        playBtn.innerHTML = '<i class="fas fa-pause"></i>';
        statusText.textContent = "EN VIVO";
        document.querySelector(".player-container").classList.add("playing");
        
        clearInterval(timerInterval);
        timerInterval = setInterval(() => {
            seconds++;
            const m = String(Math.floor(seconds / 60)).padStart(2, "0");
            const s = String(seconds % 60).padStart(2, "0");
            timerEl.textContent = `${m}:${s}`;
        }, 1000);
    }

    function resetUI() {
        playBtn.innerHTML = '<i class="fas fa-play"></i>';
        statusText.textContent = "OFFLINE";
        document.querySelector(".player-container").classList.remove("playing");
        clearInterval(timerInterval);
        seconds = 0;
        timerEl.textContent = "00:00";
    }

    // 3. CONTROLES DE PANTALLA DE BLOQUEO (iOS/Android)
    function setupMediaSession() {
        if ('mediaSession' in navigator) {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: 'Sonar Rock',
                artist: 'Radio en Vivo',
                album: 'Streaming Profesional'
            });
            navigator.mediaSession.setActionHandler('play', togglePlay);
            navigator.mediaSession.setActionHandler('pause', stopStream);
        }
    }

if ('mediaSession' in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({
        title: 'Sonar Rock',
        artist: 'Radio en Vivo',
        album: 'Señal Digital',
        artwork: [
            { src: 'logo-192x192.png', sizes: '192x192', type: 'image/png' },
            { src: 'logo-512x512.png', sizes: '512x512', type: 'image/png' }
        ]
    });

    navigator.mediaSession.setActionHandler('play', () => { togglePlay(); });
    navigator.mediaSession.setActionHandler('pause', () => { stopStream(); });
}

    if ('mediaSession' in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({
        title: 'Sonar Rock',
        artist: 'Radio en Vivo',
        album: 'Señal Digital',
        artwork: [
            { src: 'logo-192x192.png', sizes: '192x192', type: 'image/png' },
            { src: 'logo-512x512.png', sizes: '512x512', type: 'image/png' }
        ]
    });

    navigator.mediaSession.setActionHandler('play', () => { togglePlay(); });
    navigator.mediaSession.setActionHandler('pause', () => { stopStream(); });
}


    
    // EVENTOS DE BOTONES
    playBtn.addEventListener("click", togglePlay);
    stopBtn.addEventListener("click", stopStream);

    // RECONEXIÓN AUTOMÁTICA SI SE CAE LA SEÑAL
    audio.addEventListener("error", () => {
        if (isPlaying) {
            console.warn("Señal perdida, reconectando...");
            setTimeout(togglePlay, 3000); 
        }
    });
});


