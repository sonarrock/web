.player-container {
  max-width: 650px;
  margin: auto;
  position: relative;
  background: rgba(0,0,0,0.4);
  border-radius: 12px;
  padding: 20px;
  box-sizing: border-box;
}

/* Controles */
.controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
  margin-top: 10px;
  z-index: 3;
  position: relative;
}

.controls .btn {
  font-size: 18px;
  padding: 10px 14px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  background: rgba(0,0,0,0.6);
  color: #ff6600;
  transition: all 0.2s ease;
}
.controls .btn:hover {
  background: rgba(0,0,0,0.8);
}

/* Barra de progreso */
.progress-wrapper {
  display: flex;
  align-items: center;
  margin-top: 10px;
  gap: 10px;
}

.progress-container {
  flex: 1;
  height: 6px;
  background: rgba(255,255,255,0.2);
  border-radius: 3px;
  overflow: hidden;
}

#progress {
  width: 0%;
  height: 100%;
  background: #ff6600;
  border-radius: 3px;
}

/* Contador de tiempo */
.time-display {
  font-size: 12px;
  color: #fff;
  width: 45px;
  text-align: right;
}

/* Reproductor más estrecho en móviles */
@media screen and (max-width:600px){
  .player-container {
    max-width: 90%;
    padding: 15px;
  }
  .controls .btn {
    font-size: 16px;
    padding: 8px 12px;
  }
  .time-display { font-size: 10px; width: 40px; }
}
