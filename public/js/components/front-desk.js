import { navigateTo } from "../main.js";

export const renderFrontDesk = (container, socket) => {
    // Structural template for the Front Desk view
    container.innerHTML = `
        <div class="front-desk-layout">
            <h2>Racetrack MVP</h2>
            <h3>FRONT DESK</h3>
            <div class="registration-side">
                <div class="input-grid">
                    ${[1, 2, 3, 4, 5, 6, 7, 8].map(i => `
                        <div class="input-group">
                            <label>CAR ${i}</label>
                            <input type="text" class="driver-input" data-car="${i}" placeholder="Type Driver's Name...">
                        </div>
                    `).join('')}
                    
                </div>
                <button id="registerBtn">Register a Race</button>
                <button id="backBtn">Back to Main Menu</button>
            </div>

            <div class="display-side">
                <h2>RACES</h2>
                <div id="raceList"><!-- Races appear here --></div>
            </div>
        </div>
    `;

    // Interactivity for the registration form
    const registerBtn = document.getElementById('registerBtn');
    const backBtn = document.getElementById('backBtn');
    const inputs = document.querySelectorAll('.driver-input');
    const raceList = document.getElementById('raceList');

    // Send data to server
    registerBtn.addEventListener('click', () => {
        const drivers = Array.from(inputs).map(input => input.value.trim || 'Empty');
        socket.emit('registerRace', drivers); // Send to server

        // Clear inputs for the next race
        inputs.forEach(input => input.value = '');
    });

    // Listen for the server to send the updated list
    socket.on('updateRaces', (races) => {
        raceList.innerHTML = races.map((race, index) => `
            <div class="race-card">
                <h3>Race ${index + 1}</h3>
                <div class="race-drivers">
                    ${race.map((name, i) => `<p>${i + 1}st Racer: ${name}</p>`).join('')}
                </div>
                <button onclick="console.log('Edit')">EDIT RACE</button>
                <button onclick="console.log('Delete')">DELETE RACE</button>
            </div>
        `).join('');
    });

    backBtn.addEventListener('click', () => {
        // Logic to go back to the main menu
        navigateTo('/');
    });
}