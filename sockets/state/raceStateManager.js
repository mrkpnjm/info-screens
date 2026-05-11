// sockets/state/raceStateManager.js

// This is the single source of truth for the entire Racetrack MVP.
// Since this is an MVP without a database, restarting the server resets this state.

const raceState = {
  // --- 1. GLOBAL SAFETY & TIMING ---
  // Starts in 'Danger' because no race is happening when the server boots
  mode: 'Danger', 
  startTime: null,

  // --- 2. FRONT DESK QUEUE ---
  // Populated by the Receptionist. 
  // Format: [{ id: 1715000000, drivers: [{car: 1, name: "Alice"}, ...] }]
  upcomingSessions: [], 

  // --- 3. ACTIVE RACE TRACKING ---
  // Pre-initializing all 8 possible cars so the Lap-Line Tracker and 
  // Leaderboard always have a stable data structure to read/write from.
  cars: {
    '1': { currentLap: 0, lapTimes: [], fastestLap: null },
    '2': { currentLap: 0, lapTimes: [], fastestLap: null },
    '3': { currentLap: 0, lapTimes: [], fastestLap: null },
    '4': { currentLap: 0, lapTimes: [], fastestLap: null },
    '5': { currentLap: 0, lapTimes: [], fastestLap: null },
    '6': { currentLap: 0, lapTimes: [], fastestLap: null },
    '7': { currentLap: 0, lapTimes: [], fastestLap: null },
    '8': { currentLap: 0, lapTimes: [], fastestLap: null }
  }
};

module.exports = raceState;