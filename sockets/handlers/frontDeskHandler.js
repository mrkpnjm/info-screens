const raceState = require('../state/raceStateManager');

module.exports = function(io, socket) {
    
    // Helper to broadcast the updated list to all Front Desk AND Next Race screens
    const broadcastQueue = () => {
        io.emit('updateRaces', raceState.upcomingSessions);
        
        // Also update the Race Control if they are waiting for the next race
        if (raceState.upcomingSessions.length > 0 && raceState.mode === 'Danger') {
            io.emit('race_status_changed', {
                lifecycle: 'race_ready',
                safety: 'Danger',
                nextRaceData: raceState.upcomingSessions[0]
            });
        }
    };

    socket.on('registerRace', (driverNames) => {
        // Map names to car numbers 1-8
        const formattedDrivers = driverNames.map((name, index) => ({
            car: index + 1,
            name: name
        }));

        const newRace = {
            id: Date.now(), // Simple unique ID
            drivers: formattedDrivers
        };

        raceState.upcomingSessions.push(newRace);
        broadcastQueue();
    });

    socket.on('deleteRace', (raceId) => {
        raceState.upcomingSessions = raceState.upcomingSessions.filter(r => r.id !== raceId);
        broadcastQueue();
    });

    socket.on('editRace', (data) => {
        const { id, drivers } = data;
        const raceIndex = raceState.upcomingSessions.findIndex(r => r.id === id);
        
        if (raceIndex !== -1) {
            // Re-map the updated names to car numbers
            raceState.upcomingSessions[raceIndex].drivers = drivers.map((name, index) => ({
                car: index + 1,
                name: name
            }));
            broadcastQueue();
        }
    });
};