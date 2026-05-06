// public/js/lap-tracker.js
const socket = io();

// Helper function to switch screens
function showScreen(screenId) {
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

// 1. LOGIN LOGIC
function login() {
    const keyInput = document.getElementById('access-key').value;
    const errorText = document.getElementById('login-error');
    
    // Hide previous errors
    errorText.classList.add('hidden');

    socket.emit('authenticate', { role: 'observer', key: keyInput }, (response) => {
        if (response.success) {
            // Check the race state sent by the server to decide which screen to show!
            const mode = response.currentRaceState.mode;
            if (mode === 'Ended' || mode === 'Danger') {
                showScreen('view-no-race');
            } else {
                showScreen('view-ongoing');
            }
        } else {
            // Show the error message (Wait for the 500ms penalty from the server!)
            errorText.innerText = response.message;
            errorText.classList.remove('hidden');
        }
    });
}

// 2. LISTEN FOR RACE STATUS CHANGES
// The other team hasn't built this yet, but we are setting up the listener 
// so frontend is ready when they do!
socket.on('race_status_changed', (newMode) => {
    if (newMode === 'Ended' || newMode === 'Danger') {
        showScreen('view-no-race');
    } else {
        showScreen('view-ongoing');
    }
});

// 3. LAP RECORDING LOGIC

// Helper function to format milliseconds into MM:SS.SSS
function formatLapTime(ms) {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const milliseconds = ms % 1000;
    
    // padStart ensures we always have leading zeros (e.g., "01" instead of "1")
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
}

function recordLap(carNumber) {
    socket.emit('record_lap', { carNumber: carNumber }, (response) => {
        const logBox = document.getElementById('action-log');
        
        // Remove the "Waiting for first lap..." text if it is still there
        if (logBox.innerHTML.includes('Waiting for first lap...')) {
            logBox.innerHTML = '';
        }
        
        if (response.success) {
            // Format our data
            const timestamp = new Date().toLocaleTimeString();
            const formattedLapTime = formatLapTime(response.lapTimeMs);
            
            // Response string
            const logMessage = `<p>Recorded lap for Car #${carNumber}, Timestamp: ${timestamp}. Lap time: ${formattedLapTime}</p>`;
            
            // insertAdjacentHTML with 'afterbegin' pushes new messages to the TOP of the list
            logBox.insertAdjacentHTML('afterbegin', logMessage);
            
        } else {
            // Display errors at the top as well
            logBox.insertAdjacentHTML('afterbegin', `<p style="color: #C57979;">Error: ${response.message}</p>`);
        }
    });
}