// sockets/handlers/countdownHandler.js
const raceState = require('../state/raceStateManager');

module.exports = function(io, socket) {
  // When the screen connects, it needs the current time and mode
  socket.on('request_countdown_data', (callback) => {
    // Check if we are running the 1-minute dev mode or 10-minute production mode
    const isDevMode = process.env.DEV_MODE === 'true';
    const durationMs = isDevMode ? 60000 : 600000; 

    callback({
      success: true,
      mode: raceState.mode,
      startTime: raceState.startTime,
      durationMs: durationMs
    });
  });
};