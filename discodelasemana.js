// ===============================
// SONAR ROCK - DISCO DE LA SEMANA
// ===============================

document.addEventListener("DOMContentLoaded", () => {

const audio = document.getElementById("disco-audio")
const player = document.getElementById("disco-player")

if(!audio || !player) return

audio.addEventListener("play", () => {
player.classList.add("playing")
})

audio.addEventListener("pause", () => {
player.classList.remove("playing")
})

audio.addEventListener("ended", () => {
player.classList.remove("playing")
})

})
