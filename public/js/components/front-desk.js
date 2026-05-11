import { navigateTo } from "../main.js";

export const renderFrontDesk = (container, socket) => {
    // Structural template for the Front Desk view
    container.innerHTML = `
        <div class="fd-layout">
            <!-- PERSISTENT HEADER -->
            <div class="header-row">
                <h1 class="brand">Racetrack MVP</h1>
                <h2 class="page-title">FRONT DESK</h2>
            </div>
            
            <!-- VIEW 2: REGISTER A RACE -->
            <div class="fd-main-content">
                <div class="registration-side">
                    <div class="driver-input-grid">
                        ${[1, 2, 3, 4, 5, 6, 7, 8].map(i => `
                            <div class="driver-input-group">
                                <label>CAR ${i}</label>
                                <input type="text" class="driver-input" data-car="${i}" placeholder="Type Driver's Name...">
                            </div>
                        `).join('')}
                        
                    </div>

                    <div class="fd-main-button-row">
                        <button id="registerBtn">Register a Race</button>
                        <button id="backBtn">Back to Main Menu</button>
                    </div>
                </div>

                <div class="races-display-side hidden">
                    <h2>RACES</h2>
                    <div id="raceList"><!-- Races appear here --></div>
                </div>
            </div>
        </div>
    `;

    // Interactivity for the registration form
    const registerBtn = container.querySelector('#registerBtn');
    const backBtn = container.querySelector('#backBtn');
    const inputs = container.querySelectorAll('.driver-input');
    const raceListContainer = container.querySelector('#raceList');

    // THE RENDER LOGIC
    const renderRaceCards = (history) => {
        const racesSide = container.querySelector('.races-display-side');

        if (!history || history.length === 0) {
            racesSide.classList.add('hidden');
            return;
        }

        racesSide.classList.remove('hidden');

        raceListContainer.innerHTML = history.map((race) => `
            <div class="fd-race-card" data-id="${race.id}">
                <h3>${race.name.toUpperCase()}</h3>

                <div class="race-drivers" id="drivers-${race.id}">
                    ${race.drivers.map((driver) => `
                        <div class="driver-row">
                            <span>CAR ${driver.car}: </span>
                            <span class="driver-name" data-car="${driver.car}">${driver.name}</span>
                        </div>
                    `).join('')}
                </div>
                <div class="race-actions">
                    <button class="edit-btn" data-id="${race.id}">EDIT RACE</button>
                    <button class="delete-btn" data-id="${race.id}">DELETE RACE</button>
                </div>
            </div>
        `).join('');
    };

    // PERSISTENCE: ASK FOR HISTORY IMMEDIATELY WHEN VIEW LOADS
    /* socket.emit('authenticate', { role: 'receptionist', key: 'RECEPTIONIST_KEY_HERE' }, (response) => {
        if (response.success) {
            // Use the filtered list (upcomingRaces) we added to the server-side callback
            renderRaceCards(response.upcomingRaces || []);
        } else {
            console.error("Auth failed:", response.message);
            navigateTo('/'); // Kick them back to home if auth fails
        }
    }); */

    // --- UPDATED INITIALIZATION ---
    socket.emit('authenticate', { role: 'receptionist', key: 'secret_key_123' }, (response) => {
        if (response.success) {
            // Use the filtered list from the server
            renderRaceCards(response.upcomingRaces || []);
        } else {
            console.warn("Auth failed, but staying on page for development:", response.message);
            // During development, if auth fails, we should still ask for current state
        }
    });

    // REGISTRATION LOGIC
    registerBtn.addEventListener('click', () => {

        const inputs = container.querySelectorAll('.driver-input');

        // Collect names that aren't empty, regardles in which box they are in
        const enteredNames = Array.from(inputs)
        .map(input => input.value.trim())
        .filter(name => name !== '');

        // Map those names to car numbers, starting from 1
        const drivers = enteredNames.map((name, index) => ({
            name: name,
            car: (index + 1).toString() // Assign 1 to the first name, 2 to the second and so on
        }));
        
        if (drivers.length > 0) {
            socket.emit('registerRace', drivers); // Send reordered list to server

            // Clear inputs for the next race
            inputs.forEach(input => input.value = '');
        }
    });

    // ACTION DELEGATION (EDIT / DELETE / SAVE)
    raceListContainer.addEventListener('click', (e) => {
        // 1. Find the card and the ID
        const raceCard = e.target.closest('.fd-race-card');
        if (!raceCard) return; // Not a button with data-id

        const raceId = raceCard.getAttribute('data-id');

        // ---CASE: DELETE BUTTON CLICKED ---
        if (e.target.classList.contains('delete-btn')) {
            socket.emit('deleteRace', Number(raceId)); // Inform server to delete from "database"
        }

        // --- CASE: EDIT BUTTON CLICKED ---
        if (e.target.classList.contains('edit-btn')) {
            const nameSpans = raceCard.querySelectorAll('.driver-name');

            nameSpans.forEach(span => {
                const currentName = span.innerText;

                // Grab the car number from the row
                const carNumber = span.getAttribute('data-car');

                // Pass that car number into a data attribute so we don't lose it
                span.innerHTML =`<input type="text" class="edit-input" data-car="${carNumber}" value="${currentName}">`;
            })

            // Swap Edit button for Save button
            e.target.innerText = 'SAVE CHANGES';
            e.target.classList.replace('edit-btn', 'save-btn');
        }

        // --- CASE: SAVE BUTTON CLICKED ---
        else if (e.target.classList.contains('save-btn')) {
            // Look INSIDE this specific card for the inputs
            const editInputs = raceCard.querySelectorAll('.edit-input');

            // Collect new names, filtering out empties
            const updatedDrivers = Array.from(editInputs)
                .map(input => ({
                    name: input.value.trim(),
                    car: input.getAttribute('data-car')
                }))
                .filter(driver => driver.name !== ''); // Filter out empty names
            
            // Send updated list to server
            socket.emit('editRace', { id: Number(raceId), drivers: updatedDrivers });
        }
    });

    // Listen for the server to send the updated list
    socket.on('race_status_changed', (state) => {
        
    });

    socket.on('updateRaces', (history) => {
        renderRaceCards(history || []);
    })

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