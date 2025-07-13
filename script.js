
document.addEventListener('DOMContentLoaded', function() {
    const playBtn = document.getElementById('playBtn');
    const audioPlayer = document.getElementById('audioPlayer');
    const volumeSlider = document.getElementById('volumeSlider');
    const bars = document.querySelectorAll('.bar');
    
    let isPlaying = false;
    let visualizerInterval;
    
    // Play/Pause functionality
    playBtn.addEventListener('click', function() {
        if (isPlaying) {
            audioPlayer.pause();
            playBtn.innerHTML = '<i class="fas fa-play"></i>';
            stopVisualizer();
        } else {
            audioPlayer.play().catch(e => {
                console.log('Error playing audio:', e);
                // If direct play fails, try loading the stream first
                audioPlayer.load();
                setTimeout(() => {
                    audioPlayer.play().catch(err => console.log('Play error:', err));
                }, 1000);
            });
            playBtn.innerHTML = '<i class="fas fa-pause"></i>';
            startVisualizer();
        }
        isPlaying = !isPlaying;
    });
    
    // Volume control
    volumeSlider.addEventListener('input', function() {
        audioPlayer.volume = this.value / 100;
    });
    
    // Audio events
    audioPlayer.addEventListener('loadstart', function() {
        console.log('Loading audio stream...');
    });
    
    audioPlayer.addEventListener('canplay', function() {
        console.log('Audio ready to play');
    });
    
    audioPlayer.addEventListener('error', function(e) {
        console.log('Audio error:', e);
        playBtn.innerHTML = '<i class="fas fa-play"></i>';
        isPlaying = false;
        stopVisualizer();
    });
    
    audioPlayer.addEventListener('ended', function() {
        playBtn.innerHTML = '<i class="fas fa-play"></i>';
        isPlaying = false;
        stopVisualizer();
    });
    
    // Visualizer functions
    function startVisualizer() {
        visualizerInterval = setInterval(() => {
            bars.forEach(bar => {
                const height = Math.random() * 30 + 5;
                bar.style.height = height + 'px';
            });
        }, 100);
    }
    
    function stopVisualizer() {
        clearInterval(visualizerInterval);
        bars.forEach(bar => {
            bar.style.height = '5px';
        });
    }
    
    // Initialize volume
    audioPlayer.volume = 0.5;
    
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
    
    // Intersection Observer for animations
    const observerOptions = {
        threshold: 0.1,
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
    
    // Enhanced visualizer for when audio is actually playing
    if (typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined') {
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
});
