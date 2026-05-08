// sockets/socketHandler.js
const registerAuthHandlers = require('./handlers/authHandler');
const registerLapTrackerHandlers = require('./handlers/lapTrackerHandler');
const registerLeaderboardHandlers = require('./handlers/leaderboardHandler');
const registerCountdownHandlers = require('./handlers/countdownHandler');

module.exports = function(io) {
  io.on('connection', (socket) => {
    console.log('🔌 A device connected! (ID:', socket.id, ')');
    
    registerAuthHandlers(io, socket);
    registerLapTrackerHandlers(io, socket);
    registerLeaderboardHandlers(io, socket);
    registerCountdownHandlers(io, socket);

    socket.on('disconnect', () => {
      console.log('🔌 A device disconnected.');
    });
  });
};