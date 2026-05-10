// sockets/socketHandler.js

// In-memory "database" (clears, if server restarts)
let raceHistory = [];
let currentRaceIndex = -1;

let raceState = {
  lifecycle: 'no_race',   // no_race, race_ready, race_on, race_finished
  safety: 'Danger',       // Safe, Hazard, Danger
  raceName: '',
  timeRemaining: '10:00',
  startTime: null,
  nextRaceData: null,     // Will store the next race in the queue
  cars: {}                // Dynamic lap data
}

module.exports = function(io) {

  const prepareNextRace = () => {
    let nextIndex = (raceState.lifecycle === 'no_race' && raceHistory.length > currentRaceIndex) 
        ? currentRaceIndex 
        : currentRaceIndex + 1;

    if (currentRaceIndex == -1) {
      nextIndex = 0;
    }
    const nextRace = raceHistory[nextIndex];

    if (nextRace) {
      currentRaceIndex = nextIndex;
      raceState.lifecycle = 'race_ready';
      raceState.safety = 'Danger';
      raceState.raceName = `Race ${currentRaceIndex + 1}`;
      raceState.nextRaceData = nextRace; // Pass the driver list to the UI
      raceState.startTime = null;

      // Initialize lap tracking for the specific cars in this race
      raceState.cars = {};
      nextRace.drivers.forEach(d => {
        if (d.car) {
          raceState.cars[d.car] = { currentLap: 0, lapTimes: [], fastestLap: null };
        }
      });
    } else {
      // No more races left in history
      currentRaceIndex = raceHistory.length;
      raceState.lifecycle = 'no_race';
      raceState.nextRaceData = null;
      raceState.raceName = '';
    }
  }

  // Helper method for getting only upcoming races
  const getUpcomingRaces = () => {
    // HIDDEN STATES: If the race is currently on the track OR just finished,
    // we only want to show the races that come AFTER it.
    const isRaceActiveOrDone = 
      raceState.lifecycle === 'race_on' || 
      raceState.lifecycle === 'race_finished';

    if (isRaceActiveOrDone) {
      return raceHistory.slice(currentRaceIndex + 1);
    } else {
      // If we are in 'race_ready' or 'no_race', 
      // show the race at the current index (because it hasn't started yet).
      return raceHistory.slice(Math.max(0, currentRaceIndex));
    }
  }

  io.on('connection', (socket) => {
    console.log('🔌 A device connected! (ID:', socket.id, ')');

    // Send existing races to the new connection immediately
    socket.emit('updateRaces', getUpcomingRaces());
    
    // --- AUTHENTICATION LOGIC ---
    socket.on('authenticate', (data, callback) => {
      const { role, key } = data;
      const keys = {
        receptionist: process.env.receptionist_key || 'secret_key_123',
        observer: process.env.observer_key,
        safety: process.env.safety_key
      };

      if (key === keys[role]) {
        socket.join(role);
        // Return the FULL current state so the UI syncs immediately
        callback({ success: true, currentRaceState: raceState, upcomingRaces: getUpcomingRaces() });
      } else {
        setTimeout(() => callback({ success: false, message: 'Invalid Key' }), 500);
      }
    });

    // --- GLOBAL STATE CONTROL (from Race Control)
    socket.on('update_race_state', (updates) => {
      // Merge updates (for example if only 'safety' is sent, 'lifecycle' stays the same)
      Object.assign(raceState, updates);

      // SPECIAL CASE: When race starts/prepares, update the front desk
      if (updates.lifecycle === 'race_ready') {
        prepareNextRace(); // This increments currentRaceIndex
      }

      // SPECIAL CASE: If Race Control says "start", set the clock
      if (updates.lifecycle === 'race_on') {
        if (!raceState.startTime) raceState.startTime = Date.now();
      }

      // Broadcast the updated "Reality" to every single connected device
      io.emit('race_status_changed', raceState);
      io.emit('updateRaces', getUpcomingRaces());
    });

    // --- RACE REGISTRATION LOGIC ---

    socket.on('registerRace', (drivers) => {
      // Create a race object with a timestamp or ID
      const newRace = {
        id: Date.now(), // Simple unique ID based on timestamp
        drivers: drivers, // Array of 8 names from the frontend
        timestamp: new Date().toLocaleTimeString(),
        name: `Race ${raceHistory.length + 1}`
      };

      raceHistory.push(newRace); // Save to "database"
      console.log(`Race ${raceHistory.length} registered with ${drivers.length} drivers.`);

      // If we were in "no-race" mode, automatically move to "race-ready" for the first race
      if (raceState.lifecycle === 'no_race') {
          prepareNextRace();
          io.emit('race_status_changed', raceState);
      }
      io.emit('updateRaces', getUpcomingRaces());
    });

    // -- RACE EDITING LOGIC --
    socket.on('editRace', (updatedData) => {
      // Find the index of the race with the matching ID
      const index = raceHistory.findIndex(r => r.id === updatedData.id);
    
      if(index !== -1) {
        // Update the drivers but keep the original ID and timestamp
        raceHistory[index].drivers = updatedData.drivers;

        console.log(`Race ID ${updatedData.id} updated.`);

        // SYNC CHECK: IS THIS THE RACE CURRENTLY LOADED IN RACE CONTROL
        // We check, if nextRaceData exists and if its ID matches the one being edited
        if (raceState.nextRaceData && raceState.nextRaceData.id === updatedData.id) {

          // Update the state's reference to the data
          raceState.nextRaceData = raceHistory[index];
        }

        io.emit('race_status_changed', raceState);

        // Broadcast the updated history to everyone
        io.emit('updateRaces', getUpcomingRaces());
      }
    });

    socket.on('deleteRace', (raceId) => {
      const deletedIndex = raceHistory.findIndex(r => r.id === raceId);
      const isCurrentRace = raceState.nextRaceData && raceState.nextRaceData.id === raceId;

      if (deletedIndex === -1) return;

      // 2. Remove from history
      raceHistory.splice(deletedIndex, 1);

      // 3. Handle Sync Logic
      if (isCurrentRace) {
          // We set the index back by 1 so that prepareNextRace 
          // picks up the race that just shifted into the deleted slot.
          currentRaceIndex = deletedIndex - 1;

          // Reset lifecycle to 'no_race' so prepareNextRace knows it's 
          // allowed to pick up the "current" index if necessary
          raceState.lifecycle = 'no_race';
          
          prepareNextRace();

          // Broadcast the new "Next Race" (or "No Race") to Race Control
          io.emit('race_status_changed', raceState);
      } 
      else if (deletedIndex < currentRaceIndex) {
          // If we deleted a race that was already finished (behind the current index),
          // we must decrement the index to keep our pointer aligned with the array shift.
          currentRaceIndex--;
      }

      // 4. Update Front Desk list
      io.emit('updateRaces', getUpcomingRaces());
    });

    socket.on('get_current_state', (callback) => {
      // Return the full state object (which includes raceHistory)
      callback(raceState);
    })

// --- LAP-LINE TRACKER LOGIC ---
    socket.on('record_lap', (data, callback) => {
      const { carNumber } = data;

      if (raceState.lifecycle !== 'race_on') {
        return callback({ success: false, message: 'Race not active' });
      }
      if (raceState.safety === 'Danger') {
        return callback({ success: false, message: 'Track is Red - Laps suspended'});
      }

      const car = raceState.cars[carNumber];
      if (!car) {
        return callback({ success: false, message: 'Car not found.' });
      }

      const now = Date.now();
      
      // FIX: Warmup Lap Logic (Lap countdown began from race start to first lap, 
      // changed to LAP Starts when car crosses the lap first time.)
      if (car.currentLap === 0 && !car.lapStartTime) {
          car.lapStartTime = now;
          console.log(`⏱️ Car ${carNumber} crossed the line. Stopwatch started!`);
          return callback({ success: true, message: 'Stopwatch started', warmup: true });
      }

      // Calculate time since they last crossed the line
      const lapTimeMs = now - car.lapStartTime;
      
      // Update their new start time for the next lap
      car.lapStartTime = now;
      car.currentLap++;
      car.lapTimes.push(lapTimeMs);

      if (!car.fastestLap || lapTimeMs < car.fastestLap) {
        car.fastestLap = lapTimeMs;
      }

      console.log(`⏱️ Car ${carNumber} completed Lap ${car.currentLap} in ${lapTimeMs / 1000}s`);

      io.emit('lap_updated', { 
        carNumber, 
        currentLap: car.currentLap, 
        fastestLap: car.fastestLap 
      });

      callback({ success: true, lapTimeMs });
    });

    socket.on('disconnect', () => {
      console.log('🔌 A device disconnected.');
    });
  });
};