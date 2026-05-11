// public/js/components/race-control.js

export const renderRaceControl = (container, socket) => {
    // Local variable to store the latest data from the server
    let lastState = {};
    
    // --- TIMER VARIABLES ---
    let timerInterval;
    let currentLifecycle = 'idle';
    let startTime = null;
    let raceDurationMs = 600000; // Default 10 minutes
    
    container.innerHTML = `
        <div class="rc-layout">
            <!-- PERSISTENT HEADER -->
            <div class="header-row">
                <h1 class="brand">Racetrack MVP</h1>
                <h2 class="page-title">RACE CONTROL</h2>
            </div>

            <!-- VIEW 1: LOGIN -->
            <div id="rcViewLogin" class="rc-view active">
                <div class="login-container">
                    <div class="login-input-group">
                        <label for="access-key">Password:</label>
                        <input type="password" id="accessKey">
                    </div>
                    <button id="loginBtn" class="login-btn">LOGIN</button>
                    <p id="loginError" class="error-msg hidden"></p>
                </div>
            </div>

            <!-- VIEW 2: NO UPCOMING RACE -->
            <div id="rcViewNoRace" class="rc-view">
                <div class="rc-no-race-box">
                    <h2>NO UPCOMING RACE</h2>
                </div>
            </div>

            <!-- VIEW 3: RACE READY -->
            <div id="rcViewNextRace" class="rc-view ready">
                <div class="next-race-box">
                    <h2 class="box-title">NEXT RACE - <span id="nextRaceName">Unknown</span></h2>

                    <div class="competitor-grid" id="nextRaceCompetitors"></div>

                    
                </div>
                <button id="startRaceBtn" class="start-btn">START RACE</button>
            </div>

            <!-- VIEW 4: RACE ONGOING -->
            <div id="rcViewOngoingRace" class="rc-view ongoing">
                <div class="ongoing-race-box">
                    <h2 class="ongoing-box-title">TIME REMAINING:<div class="race-clock" id="timeRemaining">00:00</div></h2>
                    <div class="race-state-button">
                        <button id="safeBtn" class="safe-btn">SAFE</button>
                        <button id="hazardBtn" class="hazard-btn">HAZARD</button>
                        <button id="dangerBtn" class="danger-btn">DANGER</button>
                        <button id="finishRaceBtn" class="finish-btn">FINISH</button>
                    </div>
                </div>
                
                <div class="flag-display">
                    <h2 class="flag-title">CURRENT MODE:</h2>
                    <div class="flag-circle"></div>
                </div>
            </div>

            <!-- VIEW 5: RACE FINISHED -->
            <div id="rcViewRaceFinished" class="rc-view">
                <div class="finished-race-box">
                    <h2 class="finished-box-title">TIME REMAINING:<div class="race-clock" id="timeRemaining">00:00</div></h2>
                    <div class="finished-instruction">RACE FINISHED - WAITING CARS TO REACH PIT...</div>
                    <button id="endSessionBtn" class="end-session-btn">END SESSION</button>
                </div>
            </div>
        </div>
    `;

    const loginBtn = container.querySelector('#loginBtn');
    const accessKeyInput = container.querySelector('#accessKey');
    const errorText = container.querySelector('#loginError');

    // HELPER FUNCTION TO SWITCH VIEWS
    const showScreen = (screenId) => {
        container.querySelectorAll('.rc-view').forEach(view => {
            view.classList.remove('active');
        });
        const targetScreen = container.querySelector(`#${screenId}`);
        if (targetScreen) {
            targetScreen.classList.add('active');
        }
    };

    // HELPER FUNCTION FOR SENDING RACE AND SAFETY STATE UPDATES
    const updateGlobalState = (updates) => {
        // We emit an object containing both Lifecycle and Safety groups
        socket.emit('update_race_state', updates);
    };

    // --- NEW: THE MATH ENGINE FROM COUNTDOWN ---
    const updateTimer = () => {
        const clocks = container.querySelectorAll('.race-clock');
        
        // Memory leak prevention: stop loop if we navigate away
        if (clocks.length === 0 || !document.contains(clocks[0])) {
            clearInterval(timerInterval);
            return;
        }

        if (currentLifecycle === 'race_finished') {
            clocks.forEach(c => c.innerText = '00:00');
            return;
        }

        if (currentLifecycle !== 'race_on' || !startTime) {
            // Show starting time if we are waiting for the safety official to start it
            const mins = Math.floor(raceDurationMs / 60000);
            clocks.forEach(c => c.innerText = `${mins.toString().padStart(2, '0')}:00`);
            return;
        }

        // Calculate time left
        const now = Date.now();
        const elapsed = now - startTime;
        const remaining = Math.max(0, raceDurationMs - elapsed);

        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);

        const displayTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        clocks.forEach(c => c.innerText = displayTime);
    };

    // Start the high-speed loop
    clearInterval(timerInterval);
    timerInterval = setInterval(updateTimer, 100);

    // 1. LOGIN LOGIC
    loginBtn.addEventListener('click', () => {
        const keyInput = accessKeyInput.value;
        
        // Hide previous errors
        errorText.classList.add('hidden');

        // --- EMIT AUTHENTICATION REQUEST TO SERVER ---
        socket.emit('authenticate', { role: 'safety', key: keyInput }, (response) => {
            if (response.success) {
                // Sync the UI with the current race state sent by the server
                syncUI(response.currentRaceState);
            } else {
                // Show the error message (Wait for the 500ms penalty from the server!)
                errorText.innerText = response.message;
                errorText.classList.remove('hidden');
            }
        });
    });

    // --- 2. BUTTON EVENT LISTENERS ---

    const startRaceBtn = container.querySelector('#startRaceBtn');
    const finishRaceBtn = container.querySelector('#finishRaceBtn');
    const endSessionBtn = container.querySelector('#endSessionBtn');

    const safeBtn = container.querySelector('#safeBtn');
    const hazardBtn = container.querySelector('#hazardBtn');
    const dangerBtn = container.querySelector('#dangerBtn');

    // LIFECYCLE TRANSITIONS
    startRaceBtn.addEventListener('click', () => {
        updateGlobalState({ lifecycle: 'race_on', safety: 'Safe' });
    });
    endSessionBtn.addEventListener('click', () => {
        const hasNextRace = lastState.nextRaceData !== null;
        if (!hasNextRace) {
            updateGlobalState({ lifecycle: 'no_race', safety: 'Danger' });
        } else {
            updateGlobalState({ lifecycle: 'race_ready', safety: 'Danger' });
        }        
    });

    // SAFETY FLAG TRANSISTIONS
    safeBtn.addEventListener('click', () => {
        updateGlobalState({ safety: 'Safe' });
    });
    hazardBtn.addEventListener('click', () => {
        updateGlobalState({ safety: 'Hazard' });
    });
    dangerBtn.addEventListener('click', () => {
        updateGlobalState({ safety: 'Danger' });
    });
    finishRaceBtn.addEventListener('click', () => {
        updateGlobalState({ lifecycle: 'race_finished', safety: 'Danger' });
    });

    // --- 3. UI SYNCHRONIZATION LOGIC ---
    const syncUI = (raceState) => {
        lastState = raceState;
        const { lifecycle, safety, nextRaceData } = raceState; // Removed timeRemaining from destructuring

        // NEW: Update timer state variables
        currentLifecycle = lifecycle;
        startTime = raceState.startTime;
        if (raceState.durationMs) raceDurationMs = raceState.durationMs;

        // Map lifecycle to view ID
        const views = {
            'no_race': 'rcViewNoRace',
            'race_ready': 'rcViewNextRace',
            'race_on': 'rcViewOngoingRace',
            'race_finished': 'rcViewRaceFinished'
        };

        if (views[lifecycle]) {
            showScreen(views[lifecycle]);
        }

        if (lifecycle == 'race_ready' && nextRaceData) {
            container.querySelector('#nextRaceName').textContent = raceState.raceName;

            const grid = container.querySelector('#nextRaceCompetitors');

            // This maps exactly how many drivers were registered
            grid.innerHTML = nextRaceData.drivers.map(d => `
                <div class="competitor">CAR ${d.car} - ${d.name.toUpperCase()}</div>
            `).join('');
        }

        // Update Flag Circle
        const circle = container.querySelector('.flag-circle');
        if (circle) {
            const colors = {
                'Safe': '#47FF4D', 'Hazard': '#F7FF12', 'Danger': '#FF2121', 'Finished': '#000000' 
            };
            circle.style.backgroundColor = colors[safety] || '#FF2121';
        }
    };

    // 2. LISTEN FOR RACE STATUS CHANGES
    socket.on('race_status_changed', (raceState) => {
        syncUI(raceState);
    });
}