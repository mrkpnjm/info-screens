// 1. IMPORT TOOLS
require('dotenv').config({ quiet: true });
const express = require('express'); 
const http = require('http'); 
const { Server } = require('socket.io');
const path = require('path');

// --- 2. STARTUP SECURITY CHECK ---
// The server MUST crash if these keys are not in the .env file
const requiredKeys = ['receptionist_key', 'observer_key', 'safety_key'];
const missingKeys = requiredKeys.filter(key => !process.env[key]);

if (missingKeys.length > 0) {
  console.error('\n ERROR: Missing required environment variables.');
  console.error(`Please define the following keys in your .env file: ${missingKeys.join(', ')}`);
  console.error('See .env.example for reference.\n');
  process.exit(1); // Kills the server
}
console.log('Security keys loaded successfully.');

// --- 3. TIMER CONFIGURATION ---
// Check if we ran 'npm run dev' to set the 1-minute timer instead of 10-minute
const isDevMode = process.env.DEV_MODE === 'true';
const RACE_DURATION_MS = isDevMode ? 60000 : 600000; 
console.log(`Race duration set to ${RACE_DURATION_MS / 1000} seconds.`);

// --- 4. SET UP THE RECEPTION DESK ---
const app = express(); 
const server = http.createServer(app); 
const io = new Server(server); 

// --- 5. REQUIRED ROUTES ---

app.use(express.static(path.join(__dirname, 'public')));

// Right now they just send text, but later you will change these to send actual HTML files.

// Removed the slashes from these strings
const requiredRoutes = [
  'front-desk', 'race-control', 'lap-line-tracker', 
  'leader-board', 'next-race', 'race-countdown', 'race-flags'
];

// The helpful homepage directory
app.get(/.*|/, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- 6. REAL-TIME SOCKET.IO ---
// Import the logic from your new socketHandler file
const socketHandler = require('./sockets/socketHandler');

// Pass the 'io' variable into that file to activate it
socketHandler(io);

// --- 7. OPEN THE DOORS ---
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});