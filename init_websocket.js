const { Server } = require('socket.io');

const initWebSocket = ( http, callback ) => {
    const io = new Server( http );

    io.on('connection', (socket) => {
        console.log('un usuario se conectó');
        socket.on('disconnect', () => { console.log('usuario se desconectó'); })

        callback( socket, io );
    });
    
}

module.exports = initWebSocket;