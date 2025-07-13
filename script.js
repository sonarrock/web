
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Arial', sans-serif;
    background: #0a0a0a;
    color: #ffffff;
    line-height: 1.6;
    min-height: 100vh;
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
}

/* Header */
.header {
    background: #0a0a0a;
    padding: 20px 0;
    border-bottom: 2px solid #ff6600;
}

.logo-section {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 20px;
}

.logo {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    object-fit: cover;
    border: 3px solid #ff6600;
    box-shadow: 0 0 20px rgba(255, 102, 0, 0.3);
}

.title-section h1 {
    font-size: 3rem;
    font-weight: bold;
    color: #ff6600;
    text-shadow: 0 0 10px rgba(255, 102, 0, 0.5);
    margin-bottom: 5px;
}

.subtitle {
    font-size: 1.2rem;
    color: #cccccc;
    text-transform: uppercase;
    letter-spacing: 2px;
}

/* Main Section */
.main-section {
    padding: 40px 0;
    position: relative;
}

.main-image-container {
    position: relative;
    width: 100%;
    height: 600px;
    overflow: hidden;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
}

.main-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    background: #000;
}

.player-overlay {
    position: absolute;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: linear-gradient(transparent, rgba(0, 0, 0, 0.5));
    padding: 20px;
}

.custom-player {
    background: rgba(255, 255, 255, 0.8);
    border-radius: 15px;
    padding: 20px;
    border: 2px solid #ff6600;
    box-shadow: 0 0 30px rgba(255, 102, 0, 0.3);
    backdrop-filter: blur(5px);
    max-width: 600px;
    margin: 0 auto;
}

.player-header h2 {
    text-align: center;
    color: #ff6600;
    font-size: 1.8rem;
    margin-bottom: 15px;
    text-shadow: 0 0 10px rgba(255, 102, 0, 0.5);
    animation: titleGlow 3s ease-in-out infinite alternate;
}

@keyframes titleGlow {
    0% { text-shadow: 0 0 10px rgba(255, 102, 0, 0.5); }
    100% { text-shadow: 0 0 20px rgba(255, 102, 0, 0.8), 0 0 30px rgba(255, 102, 0, 0.4); }
}

.now-playing {
    background: rgba(0, 0, 0, 0.7);
    border-radius: 10px;
    padding: 15px;
    margin-bottom: 15px;
    border: 1px solid #ff6600;
    box-shadow: 0 0 15px rgba(255, 102, 0, 0.2);
    backdrop-filter: blur(10px);
}

.song-info {
    text-align: center;
    margin-bottom: 10px;
}

.now-playing-label {
    color: #cccccc;
    font-size: 0.9rem;
    text-transform: uppercase;
    letter-spacing: 1px;
}

.song-title {
    color: #ff6600;
    font-size: 1.2rem;
    font-weight: bold;
    margin: 5px 0;
    text-shadow: 0 0 8px rgba(255, 102, 0, 0.4);
    animation: songPulse 2s ease-in-out infinite;
}

@keyframes songPulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.02); }
}

.artist-name {
    color: #ffffff;
    font-size: 1rem;
    opacity: 0.9;
}

.live-indicator {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 5px 10px;
    background: rgba(255, 0, 0, 0.1);
    border-radius: 20px;
    border: 1px solid #ff0000;
}

.live-dot {
    width: 8px;
    height: 8px;
    background: #ff0000;
    border-radius: 50%;
    animation: livePulse 1.5s ease-in-out infinite;
}

@keyframes livePulse {
    0%, 100% { 
        opacity: 1;
        box-shadow: 0 0 5px #ff0000;
    }
    50% { 
        opacity: 0.3;
        box-shadow: 0 0 15px #ff0000;
    }
}

#programStatus {
    color: #ff0000;
    font-size: 0.8rem;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 1px;
}

.listeners-counter {
    text-align: center;
    color: #cccccc;
    font-size: 0.9rem;
    margin-bottom: 15px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
}

.listeners-counter i {
    color: #ff6600;
}

#listenersCount {
    color: #ff6600;
    font-weight: bold;
    font-size: 1rem;
}

.player-controls {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 20px;
    margin-bottom: 20px;
}

.play-btn {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: linear-gradient(45deg, #ff6600, #ff8833);
    border: none;
    color: white;
    font-size: 24px;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 15px rgba(255, 102, 0, 0.4);
}

.play-btn:hover {
    transform: scale(1.1);
    box-shadow: 0 6px 20px rgba(255, 102, 0, 0.6);
}

.volume-control {
    display: flex;
    align-items: center;
    gap: 10px;
}

.volume-control i {
    color: #ff6600;
    font-size: 18px;
}

.volume-slider {
    width: 100px;
    height: 5px;
    background: #333;
    border-radius: 5px;
    outline: none;
    -webkit-appearance: none;
}

.volume-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 15px;
    height: 15px;
    background: #ff6600;
    border-radius: 50%;
    cursor: pointer;
}

.visualizer {
    display: flex;
    justify-content: center;
    align-items: end;
    gap: 3px;
    height: 40px;
}

.bar {
    width: 4px;
    background: linear-gradient(to top, #ff6600, #ffaa66);
    border-radius: 2px;
    animation: pulse 1s ease-in-out infinite alternate;
}

.bar:nth-child(1) { animation-delay: 0s; }
.bar:nth-child(2) { animation-delay: 0.1s; }
.bar:nth-child(3) { animation-delay: 0.2s; }
.bar:nth-child(4) { animation-delay: 0.3s; }
.bar:nth-child(5) { animation-delay: 0.4s; }
.bar:nth-child(6) { animation-delay: 0.5s; }
.bar:nth-child(7) { animation-delay: 0.6s; }
.bar:nth-child(8) { animation-delay: 0.7s; }

@keyframes pulse {
    0% { height: 5px; }
    100% { height: 35px; }
}

/* Social Media */
.social-section {
    padding: 30px 0;
    background: #0a0a0a;
}

.social-buttons {
    display: flex;
    justify-content: center;
    gap: 20px;
    flex-wrap: wrap;
}

.social-btn {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    color: white;
    text-decoration: none;
    transition: all 0.3s ease;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
}

.social-btn:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.4);
}

.whatsapp { background: linear-gradient(45deg, #25d366, #128c7e); }
.facebook { background: linear-gradient(45deg, #1877f2, #42a5f5); }
.instagram { background: linear-gradient(45deg, #e4405f, #f77737); }
.spotify { background: linear-gradient(45deg, #1db954, #1ed760); }
.ivoox { background: linear-gradient(45deg, #ff6600, #ff8833); }

/* Embed Sections */
.embed-section {
    padding: 40px 0;
}

.section-title {
    text-align: center;
    font-size: 2.5rem;
    color: #ff6600;
    margin-bottom: 30px;
    text-shadow: 0 0 10px rgba(255, 102, 0, 0.3);
}

.embed-container {
    max-width: 800px;
    margin: 0 auto;
    border-radius: 15px;
    overflow: hidden;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    border: 2px solid #ff6600;
}

.spotify-embed {
    display: flex;
    justify-content: center;
}

/* Staff Section */
.staff-section {
    padding: 60px 0;
    background: #0a0a0a;
}

.staff-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 40px;
    margin-top: 40px;
}

.staff-member {
    text-align: center;
    background: rgba(26, 26, 26, 0.8);
    padding: 30px;
    border-radius: 15px;
    border: 2px solid #ff6600;
    transition: all 0.3s ease;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
}

.staff-member:hover {
    transform: translateY(-10px);
    box-shadow: 0 15px 30px rgba(255, 102, 0, 0.2);
}

.staff-image {
    width: 150px;
    height: 150px;
    border-radius: 50%;
    object-fit: cover;
    margin-bottom: 20px;
    border: 3px solid #ff6600;
    box-shadow: 0 0 20px rgba(255, 102, 0, 0.3);
}

.staff-member h3 {
    font-size: 1.5rem;
    color: #ff6600;
    text-shadow: 0 0 5px rgba(255, 102, 0, 0.3);
}

/* About Sections */
.about-section {
    padding: 60px 0;
}

.about-content {
    max-width: 800px;
    margin: 0 auto;
    text-align: center;
}

.about-text {
    font-size: 1.2rem;
    line-height: 1.8;
    color: #cccccc;
    margin-top: 20px;
}

/* Particle System */
#particles-container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: -1;
    overflow: hidden;
}

.particle {
    position: absolute;
    width: 3px;
    height: 3px;
    background: #ff6600;
    border-radius: 50%;
    animation: float linear infinite;
    opacity: 0.6;
}

@keyframes float {
    0% {
        transform: translateY(100vh) rotate(0deg);
        opacity: 0;
    }
    10% {
        opacity: 0.6;
    }
    90% {
        opacity: 0.6;
    }
    100% {
        transform: translateY(-10vh) rotate(360deg);
        opacity: 0;
    }
}

.particle.large {
    width: 5px;
    height: 5px;
    box-shadow: 0 0 10px rgba(255, 102, 0, 0.5);
}

.particle.medium {
    width: 4px;
    height: 4px;
    background: #ffaa66;
}

.particle.small {
    width: 2px;
    height: 2px;
    background: rgba(255, 102, 0, 0.7);
}

/* Enhanced Glow Effects */
.custom-player {
    background: rgba(255, 255, 255, 0.8);
    border-radius: 15px;
    padding: 20px;
    border: 2px solid #ff6600;
    box-shadow: 
        0 0 30px rgba(255, 102, 0, 0.3),
        inset 0 0 20px rgba(255, 102, 0, 0.1);
    backdrop-filter: blur(5px);
    max-width: 600px;
    margin: 0 auto;
    animation: playerGlow 4s ease-in-out infinite alternate;
}

@keyframes playerGlow {
    0% {
        box-shadow: 
            0 0 30px rgba(255, 102, 0, 0.3),
            inset 0 0 20px rgba(255, 102, 0, 0.1);
    }
    100% {
        box-shadow: 
            0 0 40px rgba(255, 102, 0, 0.5),
            0 0 60px rgba(255, 102, 0, 0.2),
            inset 0 0 30px rgba(255, 102, 0, 0.15);
    }
}

.play-btn {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: linear-gradient(45deg, #ff6600, #ff8833);
    border: none;
    color: white;
    font-size: 24px;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 
        0 4px 15px rgba(255, 102, 0, 0.4),
        0 0 20px rgba(255, 102, 0, 0.2);
    animation: buttonBreath 3s ease-in-out infinite;
}

@keyframes buttonBreath {
    0%, 100% {
        transform: scale(1);
        box-shadow: 
            0 4px 15px rgba(255, 102, 0, 0.4),
            0 0 20px rgba(255, 102, 0, 0.2);
    }
    50% {
        transform: scale(1.05);
        box-shadow: 
            0 6px 20px rgba(255, 102, 0, 0.6),
            0 0 30px rgba(255, 102, 0, 0.4);
    }
}

.play-btn:hover {
    transform: scale(1.1);
    box-shadow: 
        0 6px 20px rgba(255, 102, 0, 0.6),
        0 0 40px rgba(255, 102, 0, 0.4);
    animation: none;
}

/* Enhanced Visualizer */
.visualizer {
    display: flex;
    justify-content: center;
    align-items: end;
    gap: 3px;
    height: 40px;
    margin-top: 15px;
    padding: 10px;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 20px;
    border: 1px solid rgba(255, 102, 0, 0.3);
}

.bar {
    width: 4px;
    background: linear-gradient(to top, #ff6600, #ffaa66, #ffffff);
    border-radius: 2px;
    animation: pulse 1s ease-in-out infinite alternate;
    box-shadow: 0 0 5px rgba(255, 102, 0, 0.5);
    transition: all 0.3s ease;
}

/* Smooth Transitions */
* {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.staff-member {
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.social-btn {
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.main-image {
    transition: all 0.5s ease;
}

.main-image:hover {
    transform: scale(1.02);
    filter: brightness(1.1);
}

/* Responsive Design */
@media (max-width: 768px) {
    .title-section h1 {
        font-size: 2rem;
    }
    
    .subtitle {
        font-size: 1rem;
    }
    
    .logo-section {
        flex-direction: column;
        gap: 15px;
    }
    
    .main-image {
        height: 300px;
    }
    
    .social-buttons {
        gap: 15px;
    }
    
    .social-btn {
        width: 50px;
        height: 50px;
        font-size: 20px;
    }
    
    .staff-grid {
        grid-template-columns: 1fr;
        gap: 30px;
    }
    
    /* Optimizaciones específicas para móviles */
    .player-overlay {
        position: relative;
        padding: 15px;
        background: #0a0a0a;
    }
    
    .custom-player {
        padding: 12px;
        border-radius: 8px;
        background: rgba(26, 26, 26, 0.95);
    }
    
    .player-header h2 {
        font-size: 1.3rem;
        margin-bottom: 8px;
    }
    
    .now-playing {
        padding: 10px;
        margin-bottom: 10px;
    }
    
    .song-title {
        font-size: 1rem;
    }
    
    .artist-name {
        font-size: 0.9rem;
    }
    
    .live-indicator {
        padding: 3px 8px;
    }
    
    #programStatus {
        font-size: 0.7rem;
    }
    
    .listeners-counter {
        font-size: 0.8rem;
        margin-bottom: 10px;
    }
    
    .play-btn {
        width: 50px;
        height: 50px;
        font-size: 20px;
        touch-action: manipulation;
        -webkit-tap-highlight-color: transparent;
    }
    
    .play-btn:active {
        transform: scale(0.95);
    }
    
    .volume-control {
        touch-action: manipulation;
    }
    
    .volume-slider {
        width: 100px;
        height: 6px;
        touch-action: manipulation;
    }
    
    .volume-slider::-webkit-slider-thumb {
        width: 16px;
        height: 16px;
    }
    
    .visualizer {
        height: 25px;
        margin-top: 10px;
    }
    
    .bar {
        width: 3px;
    }
}

@media (max-width: 480px) {
    .container {
        padding: 0 15px;
    }
    
    .title-section h1 {
        font-size: 1.5rem;
    }
    
    .section-title {
        font-size: 2rem;
    }
    
    .player-controls {
        gap: 10px;
        flex-wrap: wrap;
        justify-content: center;
    }
    
    .custom-player {
        padding: 10px;
    }
    
    .player-header h2 {
        font-size: 1.1rem;
        margin-bottom: 8px;
    }
    
    .visualizer {
        height: 20px;
    }
}
