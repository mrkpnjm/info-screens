// public/js/components/lap-tracker.js

import { navigateTo } from '../main.js';

export const renderLapTracker = (container, socket) => {
    container.innerHTML = `
        <div class ="lap-tracker-layout">
            <header class="top-nav">
                <div class="brand">Racetrack MVP</div>
                <div class="page-title">LAP-LINE TRACKER</div>
            </header>

            <div id="viewLogin" class="view active">
                <div class="login-container">
                    <div class="login-input-group">
                        <label for="accessKey">Password:</label>
                        <input type="password" id="accessKey">
                    </div>
                    <button id="loginBtn" class="login-btn">LOGIN</button>
                    <p id="loginError" class="error-msg hidden"></p>
                </div>
            </div>

            <div id="viewNoRace" class="view">
                <div class="no-race-box">
                    <h2>NO ONGOING RACE</h2>
                </div>
                <button class="nav-back-btn lt-back-btn hidden">Main Menu</button>
            </div>

            <div id="viewOngoingRace" class="view">
                <p class="instruction">Tap a car's button exactly as it crosses the line.</p>
                <div class="car-grid" id="dynamicCarGrid"></div>
                <div id="actionLog" class="log-box">
                    <p><em>Waiting for first lap...</em></p>
                </div>
                <button class="nav-back-btn lt-back-btn hidden">Main Menu</button>
            </div>
        </div>
    `;

    const loginBtn = container.querySelector('#loginBtn');
    const accessKeyInput = container.querySelector('#accessKey');
    const errorText = container.querySelector('#loginError');
    const logBox = container.querySelector('#actionLog');
    const carGrid = container.querySelector('#dynamicCarGrid');
    const backBtns = container.querySelectorAll('.lt-back-btn');
    backBtns.forEach(btn => btn.addEventListener('click', () => navigateTo('/')));

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

    // Helper function to format milliseconds into MM:SS.SSS
    function formatLapTime(ms) {
        if (!ms) return "00:00.000";
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        const milliseconds = ms % 1000;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
    }

    // Helper function to dynamically generate buttons
    function renderCarButtons(state) {
        carGrid.innerHTML = ''; // Clear out any existing buttons

        if (state && state.cars) {
            Object.keys(state.cars).forEach(carNumber => {
                const btn = document.createElement('button');
                btn.className = 'car-btn';
                btn.setAttribute('data-car', carNumber);
                btn.innerText = `#${carNumber}`;
                
                // Add click listener directly to the new button
                btn.addEventListener('click', () => {
                    socket.emit('record_lap', { carNumber }, (response) => {
                        // Clear waiting message
                        if (logBox.innerHTML.includes('Waiting for first lap...')) {
                            logBox.innerHTML = '';
                        }
                        
                        if (response.success) {
                            const timestamp = new Date().toLocaleTimeString();
                            
                            // Check if this was just the warmup/stopwatch start
                            if (response.warmup) {
                                const logMessage = `<p style="color: #47FF4D;">Start line crossed for #${carNumber} at ${timestamp}. Stopwatch started!</p>`;
                                logBox.insertAdjacentHTML('afterbegin', logMessage);
                            } else {
                                const formattedLapTime = formatLapTime(response.lapTimeMs);
                                const logMessage = `<p>Recorded lap for Car #${carNumber}, Timestamp: ${timestamp}. Lap time: ${formattedLapTime}</p>`;
                                logBox.insertAdjacentHTML('afterbegin', logMessage);
                            }
                        } else {
                            logBox.insertAdjacentHTML('afterbegin', `<p style="color: #C57979;">Error: ${response.message}</p>`);
                        }
                    });
                });
                
                carGrid.appendChild(btn);
            });
        }
    }

    // 1. LOGIN LOGIC
    loginBtn.addEventListener('click', () => {
        const keyInput = accessKeyInput.value;
        errorText.classList.add('hidden');

        socket.emit('authenticate', { role: 'observer', key: keyInput }, (response) => {
            if (response.success) {
                backBtns.forEach(btn => btn.classList.remove('hidden'));
                const state = response.currentRaceState || response.state || {};
                const isRaceActive = state.lifecycle === 'race_on' || state.lifecycle === 'race_finished';

                if (!isRaceActive) {
                    showScreen('viewNoRace');
                } else {
                    showScreen('viewOngoingRace');
                    renderCarButtons(state);
                }
            } else {
                errorText.innerText = response.message;
                errorText.classList.remove('hidden');
                errorText.classList.add('error-shake');

            }
        });
    });

    // 2. LISTEN FOR RACE STATUS CHANGES
    socket.on('race_status_changed', (raceState) => {
        const isRaceActive = raceState.lifecycle === 'race_on' || raceState.lifecycle === 'race_finished';

        if (!isRaceActive) {
            showScreen('viewNoRace');
            carGrid.innerHTML = '';
        } else {
            showScreen('viewOngoingRace');
            renderCarButtons(raceState);
        }

        // HANDLE SAFETY (VISUAL) — only apply red-flag disabling during an active race,
        // not during race_finished where Danger simply means the chequered/finish state
        const body = document.body;
        const carButtons = container.querySelectorAll('.car-btn');

        if (raceState.lifecycle === 'race_on' && raceState.safety === 'Danger') {
            body.style.border = "10px solid #FF2121";
            carButtons.forEach(btn => btn.disabled = true);
        } else if (raceState.lifecycle === 'race_on' && raceState.safety === 'Hazard') {
            body.style.border = "10px solid #F7FF12";
            carButtons.forEach(btn => btn.disabled = false);
        } else {
            body.style.border = "none";
            carButtons.forEach(btn => btn.disabled = false);
        }
    });
};