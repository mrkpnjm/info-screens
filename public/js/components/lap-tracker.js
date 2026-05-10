// public/js/lap-tracker.js

/* const socket = io();
 */

export const renderLapTracker = (container, socket) => {
    container.innerHTML = `
        <div class ="lap-tracker-layout">
            <!-- PERSISTENT HEADER -->
            <header class="top-nav">
                <div class="brand">Racetrack MVP</div>
                <div class="page-title">FRONT DESK</div>
            </header>

            <!-- VIEW 1: LOGIN -->
            <div id="viewLogin" class="view active">
                <div class="login-container">
                    <div class="login-input-group">
                        <label for="access-key">Password:</label>
                        <input type="password" id="accessKey">
                    </div>
                    <button id="loginBtn" class="login-btn">LOGIN</button>
                    <p id="loginError" class="error-msg hidden"></p>
                </div>
            </div>

            <!-- VIEW 2: NO ONGOING RACE -->
            <div id="viewNoRace" class="view">
                <div class="no-race-box">
                    <h2>NO ONGOING RACE</h2>
                </div>
            </div>

            <!-- VIEW 3: ONGOING RACE (Buttons for your backend logic) -->
            <div id="viewOngoingRace" class="view">
                <p class="instruction">Tap a car's button exactly as it crosses the line.</p>
                <div class="car-grid">
                    <button class="car-btn" data-car="7">#7</button>
                    <button class="car-btn" data-car="42">#42</button>
                    <button class="car-btn" data-car="88">#88</button>
                </div>
                <div id="actionLog" class="log-box">
                    <p><em>Waiting for first lap...</em></p>
                </div>
            </div>
        </div>
    `;

    const loginBtn = container.querySelector('#loginBtn');
    const accessKeyInput = container.querySelector('#accessKey');
    const errorText = container.querySelector('#loginError');
    const logBox = container.querySelector('#actionLog');

    // Helper function to switch screens
    function showScreen(screenId) {
        container.querySelectorAll('.view').forEach(view => {
            view.classList.remove('active');
        });
        const targetScreen = container.querySelector(`#${screenId}`);
        if (targetScreen) {
            targetScreen.classList.add('active');
        }
    }

    // 1. LOGIN LOGIC
    loginBtn.addEventListener('click', () => {
        const keyInput = accessKeyInput.value;
        
        // Hide previous errors
        errorText.classList.add('hidden');

        socket.emit('authenticate', { role: 'observer', key: keyInput }, (response) => {
            if (response.success) {
                // Check the race state sent by the server to decide which screen to show!
                const mode = response.currentRaceState?.mode || 'Ended'; // Default
                if (mode === 'Ended' || mode === 'Danger') {
                    showScreen('viewNoRace');
                } else {
                    showScreen('viewOngoingRace');
                }
            } else {
                // Show the error message (Wait for the 500ms penalty from the server!)
                errorText.innerText = response.message;
                errorText.classList.remove('hidden');
            }
        });
    });

    // 2. LISTEN FOR RACE STATUS CHANGES
    // The other team hasn't built this yet, but we are setting up the listener 
    // so frontend is ready when they do!
    socket.on('race_status_changed', (raceState) => {
        const { lifecycle, safety } = raceState;
        if (lifecycle === 'race_on') {
            showScreen('viewOngoingRace');
        } else {
            showScreen('viewNoRace');
        }
    

        // HANDLE SAFETY (VISUAL)
        const body = document.body;
        const carButtons = container.querySelectorAll('.car-btn');

        if (safety === 'Danger') {
            body.style.border = "10px solid #FF2121"; // Red border warning
            carButtons.forEach(btn => btn.disabled = true);
        } else if (safety == 'Hazard') {
            body.style.border = "10px solid #F7FF12"; // Yellow border warning
            carButtons.forEach(btn => btn.disabled = false);
        } else {
            body.style.border = "none";
            carButtons.forEach(btn => btn.disabled = false);
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

    container.querySelectorAll('.car-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const carNumber = btn.getAttribute('data-car');
            socket.emit('record_lap', { carNumber }, (response) => {
            
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
        });
    });
};