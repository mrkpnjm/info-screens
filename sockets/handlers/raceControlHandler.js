const raceState = require('../state/raceStateManager');

module.exports = function(io, socket) {
    socket.on('update_race_state', (updates) => {
        if (updates.safety) {
            const validModes = ['Safe', 'Hazard', 'Danger', 'Finished'];
            if (validModes.includes(updates.safety)) {
                raceState.mode = updates.safety;
            }
        }

        if (updates.lifecycle) {
            if (updates.lifecycle === 'race_on') {
                raceState.startTime = Date.now();
                for (let car in raceState.cars) {
                    raceState.cars[car] = { currentLap: 0, lapTimes: [], fastestLap: null };
                }
                // Remove the session that just started from the queue
                if (raceState.upcomingSessions.length > 0) {
                    raceState.upcomingSessions.shift();
                    io.emit('updateRaces', raceState.upcomingSessions);
                }
            } else if (updates.lifecycle === 'race_finished') {
                raceState.mode = 'Finished';
            } else if (updates.lifecycle === 'no_race' || updates.lifecycle === 'race_ready') {
                raceState.mode = 'Danger';
            }
        }

        io.emit('race_status_changed', raceState.mode); 
    });
};