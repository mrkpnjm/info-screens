import { navigateTo } from '../main.js';

export const renderMainView = (container, socket) => {
    // Structural template for the Main View
    container.innerHTML = `
        <div class="view-container centered">
            <h1>Racetrack MVP</h1>
            <button id="frontDeskBtn" class="menu-btn">Front Desk</button>
            <button id="lapLineTrackerBtn" class="menu-btn">Lap Line Tracker</button>
            <button id="raceControlBtn" class="menu-btn">Race Control</button>
            <button id="leaderBoardBtn" class="menu-btn">Leaderboard</button>
            <button id="countDownBtn" class="menu-btn">Countdown</button>
            <button id="flagsBtn" class="menu-btn">Flags</button>
            
            <!-- Add more role buttons as needed -->
        </div>
    `;

    const frontDeskBtn = container.querySelector('#frontDeskBtn');
    const lapLineTrackerBtn = container.querySelector('#lapLineTrackerBtn');
    const raceControlBtn = container.querySelector('#raceControlBtn');
    const leaderBoardBtn = container.querySelector('#leaderBoardBtn');
    const countDownBtn = container.querySelector('#countDownBtn');
    const flagsBtn = container.querySelector('#flagsBtn');
    

    frontDeskBtn.addEventListener('click', () => {
        // Logic to switch to the Front Desk view
        navigateTo('/front-desk');
    });

    lapLineTrackerBtn.addEventListener('click', () => {
        // Logic to switch to the Lap Line Tracker view
        navigateTo('/lap-line-tracker');
    });

    raceControlBtn.addEventListener('click', () => {
        // Logic to switch to the Race Control view
        navigateTo('/race-control');
    });

    leaderBoardBtn.addEventListener('click', () => {
        // Logic to switch to the Race Control view
        navigateTo('/leader-board');
    });

    countDownBtn.addEventListener('click', () => {
        // Logic to switch to the Race Control view
        navigateTo('/race-countdown');
    })

    flagsBtn.addEventListener('click', () => {
        // Logic to switch to the Race Control view
        navigateTo('/race-flags');
    })

};