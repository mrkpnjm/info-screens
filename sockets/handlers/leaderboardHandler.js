const raceState = require('../state/raceStateManager');

module.exports = function(io, socket) {
  // When a public display connects, it asks for the current state of the race
  socket.on('request_leaderboard_data', (callback) => {
    callback({
      success: true,
      mode: raceState.mode,
      cars: raceState.cars
    });
  });
};