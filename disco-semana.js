document.addEventListener("DOMContentLoaded", () => {
  const discoAudio = document.getElementById("disco-audio");
  const cover = document.getElementById("cover");
  const trackTitle = document.getElementById("track-title");
  const radioAudio = document.getElementById("radio-audio");

  const discoData = {
    title: "Aretha Franklin – Lady Soul",
    cover: "disco-semana/portada.jpg",
    audio: "disco-semana/aretha-franklin-lady-soul.mp3"
  };

  cover.src = discoData.cover;
  trackTitle.textContent = discoData.title;
  discoAudio.src = discoData.audio;

  function pauseAllExcept(activeAudio) {
    document.querySelectorAll("audio").forEach(audio => {
      if (audio !== activeAudio && !audio.paused) {
        audio.pause();
      }
    });
  }

  discoAudio.addEventListener("play", () => {
    pauseAllExcept(discoAudio);
  });

  if (radioAudio) {
    radioAudio.addEventListener("play", () => {
      pauseAllExcept(radioAudio);
    });
  }

  document.addEventListener("click", () => {
    document.querySelectorAll("audio").forEach(audio => audio.load());
  }, { once: true });
});
