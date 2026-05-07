// public/js/leaderboard.js
const socket = io();
let currentCars = {};

// Helper function to format milliseconds into MM:SS.SSS
function formatLapTime(ms) {
    if (!ms) return '--:--.---'; // For cars that haven't finished a lap yet
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const milliseconds = ms % 1000;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
}

// Function to draw the table
function renderLeaderboard() {
    const tbody = document.getElementById('leaderboard-body');
    tbody.innerHTML = ''; // Clear the current table

    // Sort the cars to find out who is winning!
    // Primary: Most laps completed. Secondary: Fastest lap time.
    const sortedCars = Object.keys(currentCars).map(carNumber => ({
        carNumber: carNumber,
        ...currentCars[carNumber]
    })).sort((a, b) => {
        // Sort by laps (highest first)
        if (b.currentLap !== a.currentLap) {
            return b.currentLap - a.currentLap; 
        }
        // If tied on laps, sort by fastest lap (lowest first)
        if (!a.fastestLap) return 1; // Push null times to bottom
        if (!b.fastestLap) return -1;
        return a.fastestLap - b.fastestLap;
    });

    // Build the HTML for each row
    sortedCars.forEach((car, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${index + 1}</td>
            <td class="car-num">#${car.carNumber}</td>
            <td>${car.currentLap}</td>
            <td>${formatLapTime(car.fastestLap)}</td>
        `;
        tbody.appendChild(tr);
    });
}

// --- SOCKET LISTENERS ---

// 1. On load, get the current standings
socket.on('connect', () => {
    socket.emit('request_leaderboard_data', (response) => {
        if (response.success) {
            currentCars = response.cars;
            document.getElementById('race-status').innerText = `TRACK STATUS: ${response.mode.toUpperCase()}`;
            renderLeaderboard();
        }
    });
});

// 2. Listen for the broadcast from your Lap-Line Tracker!
socket.on('lap_updated', (data) => {
    if (currentCars[data.carNumber]) {
        // Update the local data memory
        currentCars[data.carNumber].currentLap = data.currentLap;
        currentCars[data.carNumber].fastestLap = data.fastestLap;
        
        // Re-sort and re-draw the table instantly
        renderLeaderboard();
    }
});

// 3. Listen for track status changes
socket.on('race_status_changed', (newMode) => {
    document.getElementById('race-status').innerText = `TRACK STATUS: ${newMode.toUpperCase()}`;
});