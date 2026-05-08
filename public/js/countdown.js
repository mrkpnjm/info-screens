// public/js/countdown.js
const socket = io();

let raceMode = 'Safe';
let startTime = null;
let raceDuration = 600000; // Default fallback
let timerInterval;

const timerDisplay = document.getElementById('timer');
const statusBadge = document.getElementById('race-status');

// --- THE MATH ENGINE ---
function updateTimer() {
    if (raceMode === 'Ended' || raceMode === 'Finish') {
        timerDisplay.innerText = '00:00';
        timerDisplay.classList.add('time-up');
        return;
    }

    if (raceMode !== 'Ongoing' || !startTime) {
        // Show starting time if we are waiting
        const mins = Math.floor(raceDuration / 60000);
        timerDisplay.innerText = `${mins.toString().padStart(2, '0')}:00`;
        return;
    }

    // Calculate time left
    const now = Date.now();
    const elapsed = now - startTime;
    const remaining = Math.max(0, raceDuration - elapsed);

    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);

    timerDisplay.innerText = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    // Visual cue for 0
    if (remaining === 0) {
        timerDisplay.classList.add('time-up');
    } else {
        timerDisplay.classList.remove('time-up');
    }
}

function updateUI() {
    statusBadge.innerText = `TRACK STATUS: ${raceMode.toUpperCase()}`;

    // Color code the banner based on safety
    if (raceMode === 'Safe' || raceMode === 'Ended') {
        statusBadge.style.backgroundColor = '#96CAFF'; 
    } else if (raceMode === 'Danger' || raceMode === 'Hazard') {
        statusBadge.style.backgroundColor = '#C57979'; 
    } else if (raceMode === 'Ongoing') {
        statusBadge.style.backgroundColor = '#2ed573'; 
    }

    clearInterval(timerInterval);
    timerInterval = setInterval(updateTimer, 100); 
    updateTimer();
}

// --- SOCKET LISTENERS ---

// 1. Initial bootup
socket.on('connect', () => {
    socket.emit('request_countdown_data', (data) => {
        if (data.success) {
            raceMode = data.mode;
            startTime = data.startTime;
            raceDuration = data.durationMs;
            updateUI();
        }
    });
});

// 2. Listen for the Safety Official changing the track status
socket.on('race_status_changed', (newMode) => {
    raceMode = newMode;
    // If it just changed to Ongoing, we need the exact millisecond it started
    socket.emit('request_countdown_data', (data) => {
        startTime = data.startTime;
        updateUI();
    });
});

// 3. Listen for the Receptionist resetting the race
socket.on('race_reset', (state) => {
    raceMode = state.mode;
    startTime = state.startTime;
    timerDisplay.classList.remove('time-up');
    updateUI();
});