import { navigateTo } from '../main.js';

export const renderMainView = (container, socket) => {
    // Structural template for the Main View
    container.innerHTML = `
        <div class="view-container centered">
            <h1>Racetrack MVP</h1>
            <button id="frontDeskBtn">Front Desk</button>
            <button id="lapLineTrackerBtn">Lap Line Tracker</button>
            <!-- Add more role buttons as needed -->
        </div>
    `;

    const frontDeskBtn = document.getElementById('frontDeskBtn');
    const lapLineTrackerBtn = document.getElementById('lapLineTrackerBtn');
    
    frontDeskBtn.addEventListener('click', () => {
        // Logic to switch to the Front Desk view
        navigateTo('/front-desk');
    });

    lapLineTrackerBtn.addEventListener('click', () => {
        // Logic to switch to the Lap Line Tracker view
        navigateTo('/lap-line-tracker');
    });
};