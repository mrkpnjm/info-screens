// public/js/components/lap-tracker.js

export const renderLapTracker = (container, socket) => {
    // 1. Inject the HTML into the SPA container
    container.innerHTML = `
        <div style="padding: 40px 60px; height: 100vh; display: flex; flex-direction: column; align-items: center;">
            <header class="header-row" style="width: 100%; max-width: 800px;">
                <div class="brand">Racetrack MVP</div>
                <div class="page-title">LAP-LINE TRACKER</div>
            </header>

            <div id="ltViewLogin" class="view active" style="width: 100%; max-width: 800px;">
                <div class="login-container">
                    <div class="login-input-group">
                        <label for="ltAccessKey">Password:</label>
                        <input type="password" id="ltAccessKey">
                    </div>
                    <button id="ltLoginBtn" class="login-btn">LOGIN</button>
                    <p id="ltLoginError" class="error-msg hidden"></p>
                </div>
            </div>

            <div id="ltViewNoRace" class="view hidden" style="width: 100%; max-width: 800px;">
                <div class="no-race-box" style="width: 100%; background: #96CAFF; height: 350px; border-radius: 20px; display: flex; justify-content: center; align-items: center;">
                    <h2 style="color: #000; font-size: 42px; font-weight: 900; margin: 0;">NO ONGOING RACE</h2>
                </div>
            </div>

            <div id="ltViewOngoing" class="view hidden" style="width: 100%; max-width: 800px;">
                <p class="instruction" style="color: #a0a0b0; font-size: 1.2rem; margin-bottom: 30px; text-align: center;">Tap a car's button exactly as it crosses the line.</p>
                
                <div class="car-grid" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 30px;">
                    ${[1, 2, 3, 4, 5, 6, 7, 8].map(carNum => `
                        <button class="btn-car" data-car="${carNum}" style="background: #4096A6; border: none; border-radius: 15px; height: 120px; cursor: pointer; font-size: 36px; font-weight: 900; color: #000;">#${carNum}</button>
                    `).join('')}
                </div>
                
                <div id="ltActionLog" class="log-box" style="background: #1a1a1a; width: 100%; height: 200px; overflow-y: auto; padding: 20px; border-radius: 12px; font-family: monospace; color: #96CAFF;">
                    <p><em>Waiting for first lap...</em></p>
                </div>
            </div>
        </div>
    `;

    // 2. DOM Elements
    const viewLogin = container.querySelector('#ltViewLogin');
    const viewNoRace = container.querySelector('#ltViewNoRace');
    const viewOngoing = container.querySelector('#ltViewOngoing');
    const loginBtn = container.querySelector('#ltLoginBtn');
    const accessKeyInput = container.querySelector('#ltAccessKey');
    const errorText = container.querySelector('#ltLoginError');
    const actionLog = container.querySelector('#ltActionLog');

    // Helper to switch views
    const showView = (viewToShow) => {
        [viewLogin, viewNoRace, viewOngoing].forEach(v => {
            v.classList.add('hidden');
            v.classList.remove('active');
        });
        viewToShow.classList.remove('hidden');
        viewToShow.classList.add('active');
    };

    // Helper to format MS into MM:SS.SSS
    const formatLapTime = (ms) => {
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        const milliseconds = ms % 1000;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
    };

    // 3. LOGIN LOGIC
    loginBtn.addEventListener('click', () => {
        const keyInput = accessKeyInput.value;
        errorText.classList.add('hidden');

        socket.emit('authenticate', { role: 'observer', key: keyInput }, (response) => {
            if (response.success) {
                const mode = response.currentRaceState.mode;
                if (mode === 'Safe' || mode === 'Hazard' || mode === 'Ongoing') {
                    showView(viewOngoing);
                } else {
                    showView(viewNoRace);
                }
            } else {
                errorText.innerText = response.message;
                errorText.classList.remove('hidden');
            }
        });
    });

// 4. RACE STATUS SYNC
    socket.on('race_status_changed', (newMode) => {
        // GHOST LISTENER SHIELD: Check if the tracker is currently on screen
        const activeLoginView = document.getElementById('ltViewLogin');
        if (!activeLoginView) return; 

        // Only react if we are logged in (i.e., not on the login screen)
        if (!activeLoginView.classList.contains('active')) {
            if (newMode === 'Safe' || newMode === 'Hazard' || newMode === 'Ongoing') {
                showView(viewOngoing);
            } else {
                showView(viewNoRace);
            }
        }
    });

    // 5. LAP RECORDING LOGIC
    container.querySelectorAll('.btn-car').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const carNumber = e.target.getAttribute('data-car');
            
            socket.emit('record_lap', { carNumber: carNumber }, (response) => {
                if (actionLog.innerHTML.includes('Waiting for first lap...')) {
                    actionLog.innerHTML = '';
                }
                
                if (response.success) {
                    const timestamp = new Date().toLocaleTimeString();
                    const formattedLapTime = formatLapTime(response.lapTimeMs);
                    const logMessage = `<p>[${timestamp}] Car #${carNumber} Lap: <strong>${formattedLapTime}</strong></p>`;
                    actionLog.insertAdjacentHTML('afterbegin', logMessage);
                } else {
                    actionLog.insertAdjacentHTML('afterbegin', `<p style="color: #C57979;">Error: ${response.message}</p>`);
                }
            });
        });
    });
};