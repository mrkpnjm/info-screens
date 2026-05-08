// sockets/socketHandler.js

// In-memory "database" (clears, if server restarts)
let raceHistory = [];

const setupRaceControl = require('./raceControl');

module.exports = function(io) {

  const raceStateRaceControl = {
    mode: "SAFE",
    upcomingSession: {
      drivers: [
        { name: "D1", car: 1, fastestLap: null, currentLap: 0 },
        { name: "D2", car: 2, fastestLap: null, currentLap: 0 },
        { name: "D3", car: 3, fastestLap: null, currentLap: 0 },
        { name: "D4", car: 4, fastestLap: null, currentLap: 0 },
        { name: "D5", car: 5, fastestLap: null, currentLap: 0 },
        { name: "D6", car: 6, fastestLap: null, currentLap: 0 },
        { name: "D7", car: 7, fastestLap: null, currentLap: 0 },
        { name: "D8", car: 8, fastestLap: null, currentLap: 0 }
      ]
    },
    currentSession: null
  };

  setupRaceControl(io, raceStateRaceControl);

  // --- RACE STATE MANAGER ---
  // This keeps track of everything happening in the current race.
  const raceState = {
    mode: 'Ongoing', // Hardcoded to 'Ongoing' right now so we can test the buttons!
    startTime: Date.now(), // Hardcoding a start time for testing
    cars: {
      '7': { currentLap: 0, lapTimes: [], fastestLap: null },
      '42': { currentLap: 0, lapTimes: [], fastestLap: null },
      '88': { currentLap: 0, lapTimes: [], fastestLap: null }
    }
  };

  io.on('connection', (socket) => {
    console.log('🔌 A device connected! (ID:', socket.id, ')');

    // Send existing races to the new connection immediately
    socket.emit('updateRaces', raceHistory);
    
    // --- AUTHENTICATION LOGIC ---
    socket.on('authenticate', (data, callback) => {
      const { role, key } = data;
      let expectedKey;

      if (role === 'receptionist') expectedKey = process.env.receptionist_key;
      else if (role === 'observer') expectedKey = process.env.observer_key;
      else if (role === 'safety') expectedKey = process.env.safety_key;
      else {
        return callback({ success: false, message: 'Invalid role.' });
      }

      if (key === expectedKey) {
        console.log(`✅ ${role} authenticated successfully.`);
        socket.join(role); 
        // We now send the raceState to the frontend on a successful login!
        callback({ success: true, message: 'Access granted.', currentRaceState: raceState });
      } else {
        console.log(`⚠️ Failed login attempt for ${role}.`);
        setTimeout(() => {
          callback({ success: false, message: 'Incorrect access key. Please try again.' });
        }, 500);
      }
    });

    // --- RACE REGISTRATION LOGIC ---
    socket.on('registerRace', (drivers) => {
      // Create a race object with a timestamp or ID
      const newRace = {
        id: Date.now(), // Simple unique ID based on timestamp
        drivers: drivers, // Array of 8 names from the frontend
        timestamp: new Date().toLocaleTimeString()
      };

      raceHistory.push(newRace); // Save to "database"
      console.log(`Race ${raceHistory.length} registered with ${drivers.length} drivers.`);

      // Broadcast the entire history to ALL connected clients
      io.emit('updateRaces', raceHistory);
    });

    // -- RACE EDITING LOGIC --
    socket.on('editRace', (updatedData) => {
      // Find the index of the race with the matching ID
      const index = raceHistory.findIndex(r => r.id === updatedData.id);
    
      if(index !== -1) {
        // Update the drivers but keep the original ID and timestamp
        raceHistory[index].drivers = updatedData.drivers;

        console.log(`Race ID ${updatedData.id} updated.`);

        // Broadcast the updated history to everyone
        io.emit('updateRaces', raceHistory);
      }
    });

    socket.on('deleteRace', (raceId) => {
      const index = raceHistory.findIndex(r => r.id === raceId);
      if (index !== -1) {
        raceHistory.splice(index, 1); // Remove the race
        io.emit('updateRaces', raceHistory); // Notify all clients
      }
    });

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

    socket.on('disconnect', () => {
      console.log('🔌 A device disconnected.');
    });
  });
};