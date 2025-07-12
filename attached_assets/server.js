
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Servir archivos estáticos
app.use(express.static('.'));

// Contador de oyentes conectados
let listenersCount = 0;

// Manejar conexiones de Socket.IO
io.on('connection', (socket) => {
    console.log('Nuevo oyente conectado:', socket.id);
    
    // Incrementar contador cuando alguien se conecta
    listenersCount++;
    
    // Enviar el contador actualizado a todos los clientes
    io.emit('listeners-update', listenersCount);
    
    // Manejar cuando un oyente comienza a escuchar
    socket.on('start-listening', () => {
        console.log('Oyente comenzó a escuchar:', socket.id);
        socket.emit('listeners-update', listenersCount);
    });
    
    // Manejar cuando un oyente para de escuchar
    socket.on('stop-listening', () => {
        console.log('Oyente paró de escuchar:', socket.id);
    });
    
    // Manejar desconexión
    socket.on('disconnect', () => {
        console.log('Oyente desconectado:', socket.id);
        listenersCount--;
        if (listenersCount < 0) listenersCount = 0;
        
        // Enviar el contador actualizado a todos los clientes
        io.emit('listeners-update', listenersCount);
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
});
