// sockets/state/raceStateManager.js

// This keeps track of everything happening in the current race.
const raceState = {
  mode: 'Ongoing', // Hardcoded to 'Ongoing' right now to test the buttons
  startTime: Date.now(), // Hardcoding a start time for testing
  cars: {
    '7': { currentLap: 0, lapTimes: [], fastestLap: null },
    '42': { currentLap: 0, lapTimes: [], fastestLap: null },
    '88': { currentLap: 0, lapTimes: [], fastestLap: null }
  }
};

module.exports = raceState;