// public/js/main.js
// Client-side logic for connecting to the Racetrack server

import { renderMainView } from './components/main-view.js';
import { renderFrontDesk } from './components/front-desk.js';

// 1. Connect to the Socket.IO server
const socket = io();
const app = document.getElementById('app');

// Define routes
const routes = {
    '/': renderMainView,
    '/front-desk': renderFrontDesk
    // -- Add more routes and their corresponding renderers as needed --
}

// Create Router function
const router = () => {
    const path = window.location.pathname;
    const renderFn = routes[path] || renderMainView; // Default to Main View if route not found

    app.innerHTML = ''; // Clear current view
    renderFn(app, socket); // Render the new view
}

// Create a Navigation helper
export const navigateTo = (url) => {
    history.pushState(null, null, url); // Updates the URL without reloading
    router(); // Calls the router to render the new view
}

// Listen for back/forward navigation
window.addEventListener('popstate', router);

// Initial call to set up the correct view based on the URL
router();

// --- Socket.IO Event Listeners ---

// 2. Listen for successful connection
socket.on('connect', () => {
    console.log('Connected to Racetrack Server with ID:', socket.id);
});

// Logic to switch views based on server roles
socket.on('viewChange', (viewName) => {
    if (viewName === 'frontDesk') {
        navigateTo('/front-desk');
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