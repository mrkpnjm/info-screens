const registerAuthHandlers = require('./handlers/authHandler');
const registerLapTrackerHandlers = require('./handlers/lapTrackerHandler');
const registerLeaderboardHandlers = require('./handlers/leaderboardHandler');
const registerCountdownHandlers = require('./handlers/countdownHandler');
const registerFrontDeskHandlers = require('./handlers/frontDeskHandler');
const registerRaceControlHandlers = require('./handlers/raceControlHandler');

module.exports = function(io) {
  io.on('connection', (socket) => {
    console.log('🔌 A device connected! (ID:', socket.id, ')');
    
    // Hand off the socket to our specific handlers
    registerAuthHandlers(io, socket);
    registerLapTrackerHandlers(io, socket);
    registerLeaderboardHandlers(io, socket);
    registerCountdownHandlers(io, socket);
    registerFrontDeskHandlers(io, socket);
    registerRaceControlHandlers(io, socket);

    socket.on('disconnect', () => {
      console.log('🔌 A device disconnected.');
    });
  });
};