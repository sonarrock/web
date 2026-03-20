document.addEventListener("DOMContentLoaded", () => {
    // 1. CONFIGURACIÓN
    const STREAM_URL = "https://stream.zeno.fm/ezq3fcuf5ehvv";
    const audio = document.getElementById("radio-audio");
    const playBtn = document.getElementById("playPauseBtn");
    const stopBtn = document.getElementById("stop-btn");
    const muteBtn = document.getElementById("mute-btn");
    const volumeSlider = document.getElementById("volume");
    const statusText = document.getElementById("status-text");
    const timerEl = document.getElementById("timer");

    let isPlaying = false;
    let timerInterval = null;
    let seconds = 0;

    // 2. FUNCIÓN DE REPRODUCCIÓN (Optimizado para iOS/Android)
    async function togglePlay() {
        if (!isPlaying) {
            // Evita caché y asegura conexión fresca
            audio.src = STREAM_URL + "?t=" + Date.now(); 
            
            try {
                await audio.play();
                isPlaying = true;
                startUI();
                setupMediaSession(); 
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
        audio.src = ""; 
        audio.load();   
        isPlaying = false;
        resetUI();
    }

    // 3. INTERFAZ Y CONTADORES
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
        document.querySelector(".player-container")?.classList.remove("playing");
        clearInterval(timerInterval);
        seconds = 0;
        timerEl.textContent = "00:00";
    }

    // 4. PANTALLA DE BLOQUEO (Solo una vez y bien configurado)
    function setupMediaSession() {
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
            navigator.mediaSession.setActionHandler('play', togglePlay);
            navigator.mediaSession.setActionHandler('pause', stopStream);
        }
    }

    // 5. VOLUMEN Y MUTE
    volumeSlider.addEventListener("input", (e) => {
        audio.volume = e.target.value;
        audio.muted = false;
        updateMuteIcon();
    });

    muteBtn.addEventListener("click", () => {
        audio.muted = !audio.muted;
        updateMuteIcon();
    });

    function updateMuteIcon() {
        muteBtn.innerHTML = audio.muted 
            ? '<i class="fas fa-volume-mute"></i>' 
            : '<i class="fas fa-volume-up"></i>';
    }

    // EVENTOS
    playBtn.addEventListener("click", togglePlay);
    stopBtn.addEventListener("click", stopStream);

    audio.addEventListener("error", () => {
        if (isPlaying) {
            statusText.textContent = "RECONECTANDO...";
            setTimeout(togglePlay, 3000); 
        }
    });
});
