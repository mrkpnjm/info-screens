// sockets/socketHandler.js

const fs = require('fs');
const path = require('path');

const isDevMode = process.env.DEV_MODE === 'true';
const RACE_DURATION = isDevMode ? 60000 : 600000;

const STATE_FILE = path.join(__dirname, '..', 'state.json');

// In-memory state
let raceHistory = [];
let currentRaceIndex = -1;

let raceState = {
  lifecycle: 'no_race',   // no_race, race_ready, race_on, race_finished
  safety: 'Danger',       // Safe, Hazard, Danger
  raceName: '',
  durationMs: RACE_DURATION,
  startTime: null,
  nextRaceData: null,
  cars: {}
};

const saveState = () => {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify({ raceHistory, currentRaceIndex, raceState }));
  } catch (e) {
    console.error('Failed to save state:', e.message);
  }
};

// Restore persisted state on startup
try {
  if (fs.existsSync(STATE_FILE)) {
    const data = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    raceHistory = data.raceHistory || [];
    currentRaceIndex = data.currentRaceIndex !== undefined ? data.currentRaceIndex : -1;
    if (data.raceState) Object.assign(raceState, data.raceState);
    // Re-link nextRaceData to the live raceHistory object
    if (currentRaceIndex >= 0 && currentRaceIndex < raceHistory.length) {
      raceState.nextRaceData = raceHistory[currentRaceIndex];
    }
    console.log('State restored from file.');
  }
} catch (e) {
  console.log('No saved state or corrupt file, starting fresh.');
}

const resequenceRaces = () => {
  raceHistory.forEach((race, index) => {
    race.name = `Race ${index + 1}`;
  });
};

module.exports = function(io) {

  // Re-schedule auto-finish timer if a race was ongoing when the server stopped
  if (raceState.lifecycle === 'race_on' && raceState.startTime) {
    const elapsed = Date.now() - raceState.startTime;
    const remaining = Math.max(0, raceState.durationMs - elapsed);
    if (remaining > 0) {
      console.log(`Resuming race with ${(remaining / 1000).toFixed(1)}s remaining.`);
      setTimeout(() => {
        if (raceState.lifecycle === 'race_on') {
          raceState.lifecycle = 'race_finished';
          raceState.safety = 'Danger';
          io.emit('race_status_changed', raceState);
          io.emit('updateRaces', getUpcomingRaces());
          saveState();
        }
      }, remaining);
    } else {
      // Race finished while the server was down
      raceState.lifecycle = 'race_finished';
      raceState.safety = 'Danger';
      saveState();
      console.log('Race finished while server was down, state updated.');
    }
  }

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
      raceState.raceName = nextRace.name;
      raceState.nextRaceData = nextRace;
      raceState.startTime = null;

      raceState.cars = {};
      nextRace.drivers.forEach(d => {
        if (d.car) {
          raceState.cars[d.car] = {
            currentLap: 0,
            lapTimes: [],
            fastestLap: null,
            lapStartTime: null
          };
        }
      });

    } else {
      // No more races left in history
      currentRaceIndex = raceHistory.length;
      raceState.lifecycle = 'no_race';
      raceState.nextRaceData = null;
      raceState.raceName = '';
    }
  };

  const getUpcomingRaces = () => {
    if (raceState.lifecycle === 'race_on' || raceState.lifecycle === 'race_finished') {
      return raceHistory.slice(currentRaceIndex + 1);
    } else {
      return raceHistory.slice(Math.max(0, currentRaceIndex));
    }
  };

  io.on('connection', (socket) => {
    console.log('🔌 A device connected! (ID:', socket.id, ')');

    socket.emit('updateRaces', getUpcomingRaces());

    // --- AUTHENTICATION LOGIC ---
    socket.on('authenticate', (data, callback) => {
      const { role, key } = data;
      const keys = {
        receptionist: process.env.receptionist_key,
        observer: process.env.observer_key,
        safety: process.env.safety_key
      };

      if (key === keys[role]) {
        socket.join(role);
        callback({ success: true, currentRaceState: raceState, upcomingRaces: getUpcomingRaces() });
      } else {
        setTimeout(() => callback({ success: false, message: 'Invalid Key' }), 500);
      }
    });

    // --- GLOBAL STATE CONTROL (from Race Control) ---
    socket.on('update_race_state', (updates) => {
      Object.assign(raceState, updates);

      if (updates.lifecycle === 'race_ready') {
        prepareNextRace();
      }

      if (updates.lifecycle === 'race_on') {
        if (!raceState.startTime) {
          raceState.startTime = Date.now();
          setTimeout(() => {
            if (raceState.lifecycle === 'race_on') {
              raceState.lifecycle = 'race_finished';
              raceState.safety = 'Danger';
              io.emit('race_status_changed', raceState);
              io.emit('updateRaces', getUpcomingRaces());
              saveState();
            }
          }, raceState.durationMs);
        }
      }

      saveState();
      io.emit('race_status_changed', raceState);
      io.emit('updateRaces', getUpcomingRaces());
    });

    // --- RACE REGISTRATION LOGIC ---
    socket.on('registerRace', (drivers) => {
      const newRace = {
        id: Date.now(),
        drivers: drivers,
        timestamp: new Date().toLocaleTimeString(),
        name: ''
      };

      raceHistory.push(newRace);
      resequenceRaces();
      console.log(`${newRace.name} registered with ${drivers.length} drivers.`);

      if (raceState.lifecycle === 'no_race') {
        prepareNextRace();
        io.emit('race_status_changed', raceState);
      }
      saveState();
      io.emit('updateRaces', getUpcomingRaces());
    });

    // --- RACE EDITING LOGIC ---
    socket.on('editRace', (updatedData) => {
      const index = raceHistory.findIndex(r => r.id === updatedData.id);

      if (index === -1) return;
      raceHistory[index].drivers = updatedData.drivers;

      if (raceState.nextRaceData && raceState.nextRaceData.id === updatedData.id) {
        raceState.nextRaceData.drivers = updatedData.drivers;
        io.emit('race_status_changed', raceState);
      }

      console.log(`Race ID ${updatedData.id} updated.`);
      saveState();
      io.emit('updateRaces', getUpcomingRaces());
    });

    // --- RACE DELETION LOGIC ---
    socket.on('deleteRace', (raceId) => {
      const deletedIndex = raceHistory.findIndex(r => r.id === raceId);

      if (deletedIndex === -1) return;

      raceHistory.splice(deletedIndex, 1);
      resequenceRaces();

      const isCurrentRace = raceState.nextRaceData && raceState.nextRaceData.id === raceId;
      if (isCurrentRace) {
        // Set index back by 1 so prepareNextRace picks up the race that
        // shifted into the deleted slot (currentRaceIndex + 1 = deletedIndex).
        currentRaceIndex = deletedIndex - 1;
        prepareNextRace();
        io.emit('race_status_changed', raceState);
      } else if (deletedIndex < currentRaceIndex) {
        currentRaceIndex--;
        raceState.raceName = raceHistory[currentRaceIndex].name;
        io.emit('race_status_changed', raceState);
      }

      saveState();
      io.emit('updateRaces', getUpcomingRaces());
    });

    socket.on('get_current_state', (callback) => {
      callback({ ...raceState, upcomingRaces: getUpcomingRaces() });
    });

    // --- LAP-LINE TRACKER LOGIC ---
    socket.on('record_lap', (data, callback) => {
      const { carNumber } = data;

      const raceActive = raceState.lifecycle === 'race_on' || raceState.lifecycle === 'race_finished';
      if (!raceActive) {
        return callback({ success: false, message: 'Race not active' });
      }
      if (raceState.lifecycle === 'race_on' && raceState.safety === 'Danger') {
        return callback({ success: false, message: 'Track is Red - Laps suspended' });
      }

      const car = raceState.cars[carNumber];
      if (!car) {
        return callback({ success: false, message: 'Car not found.' });
      }

      const now = Date.now();

      if (car.currentLap === 0 && !car.lapStartTime) {
        car.lapStartTime = now;
        console.log(`⏱️ Car ${carNumber} crossed the line. Stopwatch started!`);
        saveState();
        return callback({ success: true, message: 'Stopwatch started', warmup: true });
      }

      const lapTimeMs = now - car.lapStartTime;
      car.lapStartTime = now;
      car.currentLap++;
      car.lapTimes.push(lapTimeMs);

      if (!car.fastestLap || lapTimeMs < car.fastestLap) {
        car.fastestLap = lapTimeMs;
      }

      console.log(`⏱️ Car ${carNumber} completed Lap ${car.currentLap} in ${lapTimeMs / 1000}s`);

      saveState();
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
