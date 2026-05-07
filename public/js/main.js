// public/js/main.js
// Client-side logic for connecting to the Racetrack server

import { renderMainView } from './components/main-view.js';
import { renderFrontDesk } from './components/front-desk.js';
import { renderLapTracker } from './components/lap-tracker.js';

// 1. Connect to the Socket.IO server
const socket = io();
const app = document.getElementById('app');

// Define routes
const routes = {
    '/': renderMainView,
    '/front-desk': renderFrontDesk,
    '/lap-line-tracker': renderLapTracker
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
    if (viewName === 'lapTracker') {
        navigateTo('/lap-tracker');
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
socket.on("raceState", (raceState) => {

    const flagText = document.getElementById("flag-text");
    if (!flagText) return;

    const mode = raceState.mode;

    if (mode === "SAFE") {
        flagText.textContent = "GREEN FLAG";
    }

    else if (mode === "HAZARD") {
        flagText.textContent = "YELLOW FLAG";
    }

    else if (mode === "DANGER") {
        flagText.textContent = "RED FLAG";
    }

    else if (mode === "FINISHED") {
        flagText.textContent = "CHEQUERED FLAG";
    }

});

document.getElementById("safe-btn")?.addEventListener("click", () => {
    socket.emit("setMode", "SAFE");
});

document.getElementById("hazard-btn")?.addEventListener("click", () => {
    socket.emit("setMode", "HAZARD");
});

document.getElementById("danger-btn")?.addEventListener("click", () => {
    socket.emit("setMode", "DANGER");
});

document.getElementById("finish-btn")?.addEventListener("click", () => {
    socket.emit("setMode", "FINISHED");
});