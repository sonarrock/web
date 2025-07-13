<script>
document.addEventListener("DOMContentLoaded", () => {
    const playBtn = document.getElementById("playBtn");
    const audio = document.getElementById("audioPlayer");
    const status = document.getElementById("streamStatus");
    let isPlaying = false;

    playBtn.addEventListener("click", async () => {
        try {
            if (!isPlaying) {
                await audio.play();
                isPlaying = true;
                playBtn.textContent = "⏸ Pausar";
                status.textContent = "Reproduciendo...";
            } else {
                audio.pause();
                isPlaying = false;
                playBtn.textContent = "▶️ Reproducir";
                status.textContent = "Pausado";
            }
        } catch (e) {
            status.textContent = "Error: " + e.message;
            console.error(e);
        }
    });

    audio.addEventListener("ended", () => {
        isPlaying = false;
        playBtn.textContent = "▶️ Reproducir";
        status.textContent = "Terminado";
    });

    audio.addEventListener("error", (e) => {
        status.textContent = "Error al cargar el stream";
        console.error("Audio error:", e);
    });
});
</script>
