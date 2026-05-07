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

    raceList.addEventListener('click', (e) => {
        const raceId = e.target.getAttribute('data-id');
        if (!raceId) return; // Not a button with data-id

        // ---CASE: DELETE BUTTON CLICKED ---
        if (e.target.classList.contains('delete-btn')) {
            const driverContainer = document.getElementById(`drivers-${raceId}`);
            raceList.removeChild(driverContainer.parentElement); // Remove the entire race card from the DOM
            socket.emit('deleteRace', Number(raceId)); // Inform server to delete from "database"
        }

        // --- CASE: EDIT BUTTON CLICKED ---
        if (e.target.classList.contains('edit-btn')) {
            const driverContainer = document.getElementById(`drivers-${raceId}`);
            const nameSpans = driverContainer.querySelectorAll('.driver-name');

            // Turn spans into input fields
            nameSpans.forEach(span => {
                const currentName = span.innerText;
                span.innerHTML = `<input type="text" class="edit-input" value=${currentName}>`;
            });

            // Swap Edit button for Save button
            e.target.innerText = 'SAVE CHANGES';
            e.target.classList.replace('edit-btn', 'save-btn');
        }

        // --- CASE: SAVE BUTTON CLICKED ---
        else if (e.target.classList.contains('save-btn')) {
            const driverContainer = document.getElementById(`drivers-${raceId}`);
            const inputs = driverContainer.querySelectorAll('.edit-input');

            // Collect new names, filtering out empties
            const updatedDrivers = Array.from(inputs)
                .map(input => input.value.trim())
                .filter(name => name !== '');
            
                // Send updated list to server
                socket.emit('editRace', { id: Number(raceId), drivers: updatedDrivers });
        }
    });

    // Send data to server
    registerBtn.addEventListener('click', () => {

        const inputs = document.querySelectorAll('.driver-input');
        const drivers = Array.from(inputs)
            .map(input => input.value.trim())
            .filter(name => name !== ''); // Only include non-empty names
        
        if (drivers.length > 0) {
            socket.emit('registerRace', drivers); // Send to server

            // Clear inputs for the next race
            inputs.forEach(input => input.value = '');
        }
    });

    // Listen for the server to send the updated list
    socket.on('updateRaces', (races) => {
        const raceList = document.getElementById('raceList');

        raceList.innerHTML = races.map((race, raceIndex) => `
                <div class="race-card" data-id="${race.id}">
                    <h3>Race ${raceIndex + 1}</h3>
                    <div class="race-drivers" id="drivers-${race.id}">
                        ${race.drivers.map((name, driverIndex) => `
                            <div class="driver-row">
                                <span>${driverIndex + 1}: </span>
                                <span class="driver-name">${name}</span>
                            </div>
                        `).join('')}
                    </div>
                    <div class="race-actions">
                        <button class="edit-btn" data-id="${race.id}">EDIT RACE</button>
                        <button class="delete-btn" data-id="${race.id}">DELETE RACE</button>
                    </div>
                </div>
        `).join('');
    });

    // Helper function to get ordinal suffixes
    const getOrdinal = (n) => {
        const s = ["th", "st", "nd", "rd"],
              v = n % 100;
        return s[(v - 20) % 10] || s[v] || s[0];
    }

    backBtn.addEventListener('click', () => {
        // Logic to go back to the main menu
        navigateTo('/');
    });
}