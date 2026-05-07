// sockets/handlers/lapTrackerHandler.js
const raceState = require('../state/raceStateManager');

module.exports = function(io, socket) {
  // --- LAP-LINE TRACKER LOGIC ---
  // Listen for when the observer presses a car button on their tablet
  socket.on('record_lap', (data, callback) => {
    const { carNumber } = data;

    // 1. Security Check: Is the race actually running?
    if (raceState.mode === 'Ended' || raceState.mode === 'Danger') {
      return callback({ success: false, message: 'Cannot record laps right now.' });
    }

    // 2. Check if the car exists
    const car = raceState.cars[carNumber];
    if (!car) {
      return callback({ success: false, message: 'Car not found.' });
    }

    // 3. Calculate the lap time
    const now = Date.now();
    let lapTimeMs = 0;

    if (car.currentLap === 0) {
      // Lap 1: Time from race start to crossing the line
      lapTimeMs = now - raceState.startTime;
    } else {
      // Lap 2+: Time since they last crossed the line
      const totalPreviousTime = car.lapTimes.reduce((a, b) => a + b, 0);
      const timeSinceRaceStart = now - raceState.startTime;
      lapTimeMs = timeSinceRaceStart - totalPreviousTime;
    }

    // 4. Save the data to our state manager
    car.currentLap += 1;
    car.lapTimes.push(lapTimeMs);

    // Check if it's their new fastest lap
    if (!car.fastestLap || lapTimeMs < car.fastestLap) {
      car.fastestLap = lapTimeMs;
    }

    console.log(`⏱️ Car ${carNumber} completed Lap ${car.currentLap} in ${lapTimeMs / 1000}s`);

    // 5. Broadcast this update to the Leader Board
    io.emit('lap_updated', { 
      carNumber, 
      currentLap: car.currentLap, 
      fastestLap: car.fastestLap 
    });

    // 6. Tell the tablet it was successful
    callback({ success: true, lapTimeMs: lapTimeMs });
  });
};