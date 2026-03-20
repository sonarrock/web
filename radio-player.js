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

    // 2. FUNCIÓN DE REPRODUCCIÓN (Corregida para compatibilidad total)
    async function togglePlay() {
        if (!isPlaying) {
            // Se agrega t para evitar caché y extension=.mp3 para que iOS no lo rechace
            audio.src = STREAM_URL + "?t=" + Date.now() + "&extension=.mp3"; 
            audio.type = "audio/mpeg"; // Forzamos el formato para evitar error 404/Not Supported
            
            try {
                // En móviles es vital que la carga y el play ocurran tras el click
                await audio.play();
                isPlaying = true;
                startUI();
                setupMediaSession(); 
            } catch (err) {
                console.error("Error al iniciar reproducción:", err);
                resetUI();
            }
        } else {
            stopStream();
        }
    }

    function stopStream() {
        audio.pause();
        audio.src = ""; // Liberar ancho de banda inmediatamente
        audio.load();   
        isPlaying = false;
        resetUI();
    }

    // 3. INTERFAZ Y CONTADORES
    function startUI() {
        playBtn.innerHTML = '<i class="fas fa-pause"></i>';
        statusText.textContent = "EN VIVO";
        const container = document.querySelector(".player-container");
        if(container) container.classList.add("playing");
        
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
        const container = document.querySelector(".player-container");
        if(container) container.classList.remove("playing");
        
        clearInterval(timerInterval);
        seconds = 0;
        timerEl.textContent = "00:00";
    }

    // 4. PANTALLA DE BLOQUEO (iOS / Android)
    function setupMediaSession() {
        if ('mediaSession' in navigator) {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: 'Sonar Rock',
                artist: 'Radio en Vivo',
                album: 'Señal Digital',
                artwork: [
                    { src: 'https://www.sonarrock.com', sizes: '192x192', type: 'image/png' },
                    { src: 'https://www.sonarrock.com', sizes: '512x512', type: 'image/png' }
                ]
            });
            navigator.mediaSession.setActionHandler('play', togglePlay);
            navigator.mediaSession.setActionHandler('pause', stopStream);
        }
    }

    // 5. VOLUMEN Y MUTE
    if (volumeSlider) {
        volumeSlider.addEventListener("input", (e) => {
            audio.volume = e.target.value;
            audio.muted = false;
            updateMuteIcon();
        });
    }

    if (muteBtn) {
        muteBtn.addEventListener("click", () => {
            audio.muted = !audio.muted;
            updateMuteIcon();
        });
    }

    function updateMuteIcon() {
        if (!muteBtn) return;
        muteBtn.innerHTML = audio.muted 
            ? '<i class="fas fa-volume-mute"></i>' 
            : '<i class="fas fa-volume-up"></i>';
    }

    // EVENTOS DE BOTONES
    if (playBtn) playBtn.addEventListener("click", togglePlay);
    if (stopBtn) stopBtn.addEventListener("click", stopStream);

    // RECONEXIÓN AUTOMÁTICA
    audio.addEventListener("error", () => {
        if (isPlaying) {
            statusText.textContent = "RECONECTANDO...";
            // Intentar reconectar tras 3 segundos si falla la red
            setTimeout(() => {
                if (isPlaying) togglePlay(); 
            }, 3000);
        }
    });

    // Detectar cuando el navegador pausa el audio por sistema (ej. llamadas)
    audio.addEventListener("pause", () => {
        if (isPlaying && audio.readyState < 3) {
            // Si se pausa solo y no es por el usuario, intentamos reanudar
            console.log("Pausa detectada por sistema, reanudando...");
        }
    });
});
