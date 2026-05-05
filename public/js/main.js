// public/js/main.js
// Client-side logic for connecting to the Racetrack server

// 1. Connect to the Socket.IO server
const socket = io();

// 2. Listen for successful connection
socket.on('connect', () => {
    console.log('Connected to Racetrack Server with ID:', socket.id);
});

// Template for the frontend team to use your authentication logic:
/*
function login(roleName, password) {
    socket.emit('authenticate', { role: roleName, key: password }, (response) => {
        if (response.success) {
            console.log("Logged in!");
            // Hide login screen, show dashboard
        } else {
            alert(response.message); // Shows the error after the 500ms server delay
        }
    });
}
*/