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