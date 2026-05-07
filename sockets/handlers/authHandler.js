// sockets/handlers/authHandler.js
const raceState = require('../state/raceStateManager');

module.exports = function(io, socket) {
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
};