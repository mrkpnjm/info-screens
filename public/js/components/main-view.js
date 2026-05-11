import { navigateTo } from '../main.js';

export const renderMainView = (container, socket) => {
    container.innerHTML = `
        <div class="view-container centered" style="padding: 40px; display: flex; flex-direction: column; align-items: center;">
            
            <header class="header-row">
                <h1 class="brand">Beachside <span style="color: #C57979;">Racetrack</span></h1>
                <h2 class="page-title">Main Menu</h2>
            </header>

            <div class="cards-wrapper" style="display: flex; gap: 40px; flex-wrap: wrap; justify-content: center; width: 100%;">
                
                <div class="menu-card" style="background: #3d3d3d; padding: 40px; border-radius: 20px; width: 400px; text-align: center;">
                    <h3 style="margin-bottom: 30px; font-weight: 900; letter-spacing: 1px;">EMPLOYEE TOOLS</h3>
                    <div style="display: flex; flex-direction: column; gap: 20px; align-items: center;">
                        <button id="frontDeskBtn" class="login-btn" style="width: 100%;">FRONT DESK</button>
                        <button id="raceControlBtn" class="login-btn" style="width: 100%;">RACE CONTROL</button>
                        <button id="lapLineTrackerBtn" class="login-btn" style="width: 100%;">LAP TRACKER</button>
                    </div>
                </div>

                <div class="menu-card" style="background: #3d3d3d; padding: 40px; border-radius: 20px; width: 400px; text-align: center;">
                    <h3 style="margin-bottom: 30px; font-weight: 900; letter-spacing: 1px;">PUBLIC DISPLAYS</h3>
                    <div style="display: flex; flex-direction: column; gap: 20px; align-items: center;">
                        <button id="leaderBoardBtn" class="login-btn" style="width: 100%; background-color: #C57979;">LEADERBOARD</button>
                        <button id="nextRaceBtn" class="login-btn" style="width: 100%; background-color: #C57979;">NEXT RACE</button>
                        <button id="countDownBtn" class="login-btn" style="width: 100%; background-color: #C57979;">COUNTDOWN</button>
                        <button id="flagsBtn" class="login-btn" style="width: 100%; background-color: #C57979;">TRACK FLAGS</button>
                    </div>
                </div>

            </div>
        </div>
    `;

    // Event listeners
    const routes = {
        'frontDeskBtn': '/front-desk',
        'raceControlBtn': '/race-control',
        'lapLineTrackerBtn': '/lap-line-tracker',
        'leaderBoardBtn': '/leader-board',
        'nextRaceBtn': '/next-race',
        'countDownBtn': '/race-countdown',
        'flagsBtn': '/race-flags'
    };

    Object.entries(routes).forEach(([id, path]) => {
        const btn = container.querySelector(`#${id}`);
        if (btn) btn.addEventListener('click', () => navigateTo(path));
    });
};