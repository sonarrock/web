document.addEventListener('DOMContentLoaded', function () {
    const playBtn = document.getElementById('playBtn');
    const audio = document.getElementById('audioPlayer');
    const icon = playBtn.querySelector('i');
    const volumeSlider = document.getElementById('volumeSlider');
    const bars = document.querySelectorAll('.bar');

    let isPlaying = false;
    let visualizerInterval;

    playBtn.addEventListener('click', function () {
        if (!isPlaying) {
            audio.play().then(() => {
                icon.className = 'fas fa-pause';
                isPlaying = true;
                startVisualizer();
            }).catch((e) => {
                alert("Error al reproducir: " + e.message);
                console.log(e);
            });
        } else {
            audio.pause();
            icon.className = 'fas fa-play';
            isPlaying = false;
            stopVisualizer();
        }
    });

    volumeSlider.addEventListener('input', function () {
        audio.volume = this.value / 100;
    });

    function startVisualizer() {
        if (visualizerInterval) clearInterval(visualizerInterval);
        visualizerInterval = setInterval(() => {
            bars.forEach(bar => {
                const height = Math.random() * 30 + 5;
                bar.style.height = `${height}px`;
            });
        }, 150);
    }

    function stopVisualizer() {
        clearInterval(visualizerInterval);
        bars.forEach(bar => {
            bar.style.height = '5px';
        });
    }

    // Inicializa volumen
    audio.volume = 1.0;
    volumeSlider.value = 100;
});
