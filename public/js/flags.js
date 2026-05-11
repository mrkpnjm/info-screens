// public/js/flags.js
const socket = io();

// Map the modes to the background colors requested in the MVP
const flagColors = {
    'Safe': '#2ed573',      // Solid Green
    'Hazard': '#F7FF12',    // Solid Yellow
    'Danger': '#FF2121',    // Solid Red
    'Finished': 'repeating-conic-gradient(#000 0% 25%, #FFF 0% 50%) 50% / 100px 100px' // Chequered
};

// 1. Get initial state on load
socket.on('connect', () => {
    socket.emit('request_countdown_data', (data) => {
        if (data.success) {
            document.body.style.background = flagColors[data.mode] || '#2C2C2C';
        }
    });
});

// 2. Listen for the Safety Official's commands
socket.on('race_status_changed', (newMode) => {
    document.body.style.background = flagColors[newMode] || '#2C2C2C';
});