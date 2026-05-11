export const renderRaceControl = (container, socket) => {
    // Local variable to store the latest data from the server
    let lastState = {};
    
    container.innerHTML = `
        <div class="rc-layout">
            <div class="header-row">
                <h1 class="brand">Racetrack MVP</h1>
                <h2 class="page-title">RACE CONTROL</h2>
            </div>

            <div id="rcViewLogin" class="rc-view active">
                <div class="login-container">
                    <div class="login-input-group">
                        <label for="accessKey">Password:</label>
                        <input type="password" id="accessKey">
                    </div>
                    <button id="loginBtn" class="login-btn">LOGIN</button>
                    <p id="loginError" class="error-msg hidden"></p>
                </div>
            </div>

            <div id="rcViewNoRace" class="rc-view">
                <div class="rc-no-race-box">
                    <h2>NO UPCOMING RACE</h2>
                </div>
            </div>

            <div id="rcViewNextRace" class="rc-view ready">
                <div class="next-race-box">
                    <h2 class="box-title">NEXT RACE - <span id="nextRaceName">Unknown</span></h2>
                    <div class="competitor-grid" id="nextRaceCompetitors"></div>
                </div>
                <button id="startRaceBtn" class="start-btn">START RACE</button>
            </div>

            <div id="rcViewOngoingRace" class="rc-view ongoing">
                <div class="ongoing-race-box">
                    <h2 class="ongoing-box-title">TIME REMAINING:<div class="race-clock" id="timeRemainingOngoing">00:00</div></h2>
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

            <div id="rcViewRaceFinished" class="rc-view">
                <div class="finished-race-box" style="background-color: #96CAFF; width: 750px; min-height: 280px; border-radius: 20px; display: flex; flex-direction: column; align-items: center; padding: 30px; margin-bottom: 30px;">
                    <h2 class="finished-box-title" style="color: #000000; font-size: 28px; font-weight: 900; text-align: center; margin: 0 0 30px 0;">TIME REMAINING:<div class="race-clock" id="timeRemainingFinished">00:00</div></h2>
                    <div class="finished-instruction" style="font-size: 24px; font-weight: 900; color: #000; margin-bottom: 30px; text-align: center;">RACE FINISHED - WAITING CARS TO REACH PIT...</div>
                    <button id="endSessionBtn" class="end-session-btn" style="width: 320px; height: 70px; background-color: #FF2121; color: #ffffff; border: none; border-radius: 35px; font-size: 24px; font-weight: 900; cursor: pointer;">END SESSION</button>
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
        const hasNextRace = lastState.upcomingSessions && lastState.upcomingSessions.length > 0;
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
    const syncUI = (serverState) => {
        lastState = serverState;
        
        // 1. Translate our backend state into the teammate's expected variables
        let lifecycle = 'no_race';
        let safety = serverState.mode;
        let nextRaceData = (serverState.upcomingSessions && serverState.upcomingSessions.length > 0) 
                           ? serverState.upcomingSessions[0] : null;

        // Determine the lifecycle phase based on the track safety mode
        if (safety === 'Safe' || safety === 'Hazard' || safety === 'Ongoing') {
            lifecycle = 'race_on';
        } else if (safety === 'Finished') {
            lifecycle = 'race_finished';
        } else if (safety === 'Danger') {
            lifecycle = nextRaceData ? 'race_ready' : 'no_race';
        }

        // 2. Map lifecycle to view ID and switch screens
        const views = {
            'no_race': 'rcViewNoRace',
            'race_ready': 'rcViewNextRace',
            'race_on': 'rcViewOngoingRace',
            'race_finished': 'rcViewRaceFinished'
        };

        if (views[lifecycle]) {
            showScreen(views[lifecycle]);
        }

        // 3. Populate Next Race Data (If we are waiting to start)
        if (lifecycle === 'race_ready' && nextRaceData) {
            container.querySelector('#nextRaceName').textContent = "Upcoming Session";
            const grid = container.querySelector('#nextRaceCompetitors');
            
            grid.innerHTML = nextRaceData.drivers.map(d => `
                <div class="competitor" style="font-weight: 900; font-size: 20px;">CAR ${d.car} - ${d.name.toUpperCase()}</div>
            `).join('');
        }

        // 4. Update the Safety Flag Circle color
        const circle = container.querySelector('.flag-circle');
        if (circle) {
            const colors = {
                'Safe': '#47FF4D', 'Hazard': '#F7FF12', 'Danger': '#FF2121', 'Finished': '#FFFFFF' 
            };
            circle.style.backgroundColor = colors[safety] || '#FF2121';
        }
    };

    // --- 4. SERVER LISTENERS ---
    
    // Listen for the Safety Official changing modes
    socket.on('race_status_changed', (newMode) => {
        // 🛡️ BULLETPROOF GHOST SHIELD 🛡️
        const loginScreen = document.getElementById('rcViewLogin');
        if (!loginScreen) return; // If we are on another page, instantly stop executing!

        // Only update if we are past the login screen
        if (!loginScreen.classList.contains('active')) {
            lastState.mode = newMode;
            syncUI(lastState);
        }
    });

    // Listen for the Receptionist adding/deleting races
    socket.on('updateRaces', (races) => {
        // 🛡️ BULLETPROOF GHOST SHIELD 🛡️
        const loginScreen = document.getElementById('rcViewLogin');
        if (!loginScreen) return; // If we are on another page, instantly stop executing!

        // Only update if we are past the login screen
        if (!loginScreen.classList.contains('active')) {
            lastState.upcomingSessions = races;
            syncUI(lastState);
        }
    });
};