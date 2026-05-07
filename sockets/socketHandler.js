// sockets/socketHandler.js

// In-memory "database" (clears, if server restarts)
let raceHistory = [];

module.exports = function(io) {
  io.on('connection', (socket) => {
    console.log('A device connected to the racetrack server! (ID:', socket.id, ')');

    // Send existing races to the new connection immediately
    socket.emit('updateRaces', raceHistory);
    
    // Listen for an 'authenticate' event from the frontend
    socket.on('authenticate', (data, callback) => {
      const { role, key } = data;
      let expectedKey;

      if (role === 'receptionist') expectedKey = process.env.receptionist_key;
      else if (role === 'observer') expectedKey = process.env.observer_key;
      else if (role === 'safety') expectedKey = process.env.safety_key;
      else {
        return callback({ success: false, message: 'Invalid role.' });
      }

      // -- THE AUTHENTICATION LOGIC --
      if (key === expectedKey) {
        console.log(`${role} authenticated successfully.`);
        socket.join(role); 
        callback({ success: true, message: 'Access granted.' });
      } else {
        console.log(`Failed login attempt for ${role}.`);
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

    socket.on('disconnect', () => {
      console.log('A device disconnected.');
    });
  });
};