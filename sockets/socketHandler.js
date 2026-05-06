// sockets/socketHandler.js

const setupLapLineTracker = require('./lapLineTracker');

module.exports = function(io) {

  const raceState = {
    mode: "SAFE",
    currentSession: {
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
    }
  };

  setupLapLineTracker(io, raceState);

  io.on('connection', (socket) => {
    console.log('A device connected to the racetrack server! (ID:', socket.id, ')');
    
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

    socket.on('disconnect', () => {
      console.log('A device disconnected.');
    });
  });
};