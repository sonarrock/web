 <script>
        document.addEventListener("DOMContentLoaded", function () {
            const playBtn = document.getElementById("playBtn");
            const audioPlayer = document.getElementById("audioPlayer");
            const volumeSlider = document.getElementById("volumeSlider");
            const streamStatus = document.getElementById("streamStatus");
            const bars = document.querySelectorAll(".bar");

            let isPlaying = false;
            let visualizerInterval = null;

            // Detectar iOS
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

            audioPlayer.volume = 1;

            function updateStatus(message, type = "") {
                if (streamStatus) {
                    streamStatus.textContent = message;
                    streamStatus.className = "stream-status " + type;
                }
            }

            async function playAudio() {
                try {
                    audioPlayer.pause();
                    audioPlayer.src = "https://stream-176.zeno.fm/ezq3fcuf5ehvv";
                    audioPlayer.load();
                    audioPlayer.volume = 1;

                    if (isIOS) {
                        await new Promise((r) => setTimeout(r, 200));
                    }

                    await audioPlayer.play();
                    isPlaying = true;
                    playBtn.innerHTML = '<i class="fas fa-pause"></i>';
                    updateStatus("Reproduciendo...", "playing");
                    startVisualizer();
                } catch (e) {
                    console.error("Error al reproducir:", e);
                    updateStatus("Toca de nuevo para reproducir", "error");
                    isPlaying = false;
                    playBtn.innerHTML = '<i class="fas fa-play"></i>';
                }
            }

            function pauseAudio() {
                audioPlayer.pause();
                isPlaying = false;
                playBtn.innerHTML = '<i class="fas fa-play"></i>';
                updateStatus("Pausado");
                stopVisualizer();
            }

            playBtn.addEventListener("click", async () => {
                if (isPlaying) {
                    pauseAudio();
                } else {
                    await playAudio();
                }
            });

            volumeSlider.addEventListener("input", () => {
                audioPlayer.volume = volumeSlider.value / 100;
            });

            function startVisualizer() {
                stopVisualizer();
                visualizerInterval = setInterval(() => {
                    bars.forEach((bar) => {
                        const height = Math.random() * 30 + 5;
                        bar.style.height = height + "px";
                    });
                }, 150);
            }

            function stopVisualizer() {
                if (visualizerInterval) {
                    clearInterval(visualizerInterval);
                    visualizerInterval = null;
                }
                bars.forEach((bar) => {
                    bar.style.height = "5px";
                });
            }

            // Evento para errores de audio
            audioPlayer.addEventListener("error", function () {
                const error = audioPlayer.error;
                if (error) {
                    switch (error.code) {
                        case error.MEDIA_ERR_ABORTED:
                            console.error("Reproducción abortada.");
                            break;
                        case error.MEDIA_ERR_NETWORK:
                            console.error("Error de red al descargar el audio.");
                            break;
                        case error.MEDIA_ERR_DECODE:
                            console.error("Error al decodificar el audio.");
                            break;
                        case error.MEDIA_ERR_SRC_NOT_SUPPORTED:
                            console.error("El formato no es compatible o no se pudo cargar.");
                            break;
                        default:
                            console.error("Error desconocido de audio.");
                            break;
                    }
                }
            });
        });
    </script>
</body>
</html>
