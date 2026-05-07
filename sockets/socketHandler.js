// sockets/socketHandler.js
const registerAuthHandlers = require('./handlers/authHandler');
const registerLapTrackerHandlers = require('./handlers/lapTrackerHandler');
const registerLeaderboardHandlers = require('./handlers/leaderboardHandler');

module.exports = function(io) {
  io.on('connection', (socket) => {
    console.log('🔌 A device connected! (ID:', socket.id, ')');
    
    // Hand the socket off to our specialized handler files
    registerAuthHandlers(io, socket);
    registerLapTrackerHandlers(io, socket);
    registerLeaderboardHandlers(io, socket);

    socket.on('disconnect', () => {
      console.log('🔌 A device disconnected.');
    });
  });
};