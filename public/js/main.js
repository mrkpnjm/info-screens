// public/js/main.js
// Client-side logic for connecting to the Racetrack server

import { renderMainView } from './components/MainView.js';
import { rendererFrontDesk } from './components/FrontDesk.js';

// 1. Connect to the Socket.IO server
const socket = io();
const app = document.getElementById('app');

// Initial state: show the Main View
renderMainView(app, socket);

// 2. Listen for successful connection
socket.on('connect', () => {
    console.log('Connected to Racetrack Server with ID:', socket.id);
});

// Logic to switch views based on server roles
socket.on('viewChange', (viewName) => {
    app.innerHTML = ''; // Clear current view
    if (viewName === 'frontDesk') {
        rendererFrontDesk(app, socket);
    }
    // Add more view renderers as needed (e.g., observerView, safetyView)
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