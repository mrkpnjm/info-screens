import { navigateTo } from "../main.js";

export const renderFrontDesk = (container, socket) => {
    // Structural template for the Front Desk view
    container.innerHTML = `
        <div class="fd-layout">
            <!-- PERSISTENT HEADER -->
            <div class="fd-header-container">
                <header class="header-row">
                    <h1 class="brand">Racetrack MVP</h1>
                    <h2 class="page-title">FRONT DESK</h2>
                </header>
            </div>

            <!-- VIEW 1: LOGIN -->
            <div id="fdLoginView" class="fd-login-view active">
                <section class="login-container">
                    <div class="login-input-group">
                        <label for="access-key">Password:</label>
                        <input type="password" id="accessKey">
                    </div>
                    <button id="loginBtn" class="login-btn">LOGIN</button>
                    <p id="loginError" class="error-msg hidden"></p>
                </section>
            </div>
            
            <!-- VIEW 2: REGISTER A RACE -->
            <div id="fdMainView" class="fd-main-view">
                <section class="registration-side">
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
                        <p id="duplicateNameError" class="fd-register-error-msg hidden"></p>
                    </div>
                </section>

                <section class="races-display-side hidden">
                    <h2>RACES</h2>
                    <div id="raceList"><!-- Races appear here --></div>
                </section>
            </div>
        </div>
    `;

    // Interactivity for the registration form
    const registerBtn = container.querySelector('#registerBtn');
    const backBtn = container.querySelector('#backBtn');
    const inputs = container.querySelectorAll('.driver-input');
    const raceListContainer = container.querySelector('#raceList');
    const registerErrorText = container.querySelector('#duplicateNameError');

    // HELPER FUNCTION TO SWITCH VIEWS
    const showScreen = (view) => {
        if (view === 'main') {
            container.querySelector('#fdMainView').classList.add('active');
            container.querySelector('#fdLoginView').classList.remove('active');
        }
    };

    // THE RENDER LOGIC
    const renderRaceCards = (history) => {
        const racesSide = container.querySelector('.races-display-side');
        if (!racesSide) return;

        if (!history || history.length === 0) {
            racesSide.classList.add('hidden');
            return;
        }

        racesSide.classList.remove('hidden');

        raceListContainer.innerHTML = history.map((race) => `
            <div class="fd-race-card" data-id="${race.id}">
                <h3 class="fd-card-title">${race.name.toUpperCase()}</h3>
                <div class="race-drivers" id="drivers-${race.id}">
                    ${race.drivers.map((driver) => `
                        <div class="driver-row">
                            <span class="car-badge">#${driver.car}</span>
                            <span class="driver-name" data-car="${driver.car}">${driver.name}</span>
                        </div>
                    `).join('')}
                </div>
                <div class="race-actions">
                    <button class="edit-btn" data-id="${race.id}">Edit</button>
                    <button class="delete-btn" data-id="${race.id}">Delete</button>
                </div>
            </div>
        `).join('');
    };

    const loginBtn = container.querySelector('#loginBtn');
    const accessKeyInput = container.querySelector('#accessKey');
    const loginErrorText = container.querySelector('#loginError');

    // 1. LOGIN LOGIC
    loginBtn.addEventListener('click', () => {
        const keyInput = accessKeyInput.value;
        
        // Hide previous errors
        loginErrorText.classList.add('hidden');
        loginErrorText.classList.remove('error-shake');
        
        void loginErrorText.offsetWidth;

        // --- EMIT AUTHENTICATION REQUEST TO SERVER ---
        socket.emit('authenticate', { role: 'receptionist', key: keyInput }, (response) => {
            if (response.success) {
                showScreen('main');
                renderRaceCards(response.upcomingRaces || []);
            } else {
                // Show the error message (Wait for the 500ms penalty from the server!)
                loginErrorText.innerText = response.message;
                loginErrorText.classList.remove('hidden');
                loginErrorText.classList.add('error-shake')
            }
        });
    });

    // REGISTRATION LOGIC
    registerBtn.addEventListener('click', () => {

        const inputs = container.querySelectorAll('.driver-input');

        registerErrorText.classList.add('hidden');
        registerErrorText.classList.remove('error-shake');

        // Force a "reflow" (this makes the browser notice the class was removed)
        void registerErrorText.offsetWidth;

        // Collect drivers from whichever boxes have names, preserving their car number
        const drivers = Array.from(inputs)
            .filter(input => input.value.trim() !== '')
            .map(input => ({
                name: input.value.trim(),
                car: input.getAttribute('data-car')
            }));

        const enteredNames = drivers.map(d => d.name);
        const namesSet = new Set(enteredNames);

        if (enteredNames.length > namesSet.size) {
            registerErrorText.innerText = "No duplicate drivers allowed!";
            registerErrorText.classList.remove('hidden');
            registerErrorText.classList.add('error-shake');
            return;
        }
        
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
            const driversContainer = raceCard.querySelector(`#drivers-${raceId}`);

            const existing = {};
            raceCard.querySelectorAll('.driver-name').forEach(span => {
                existing[span.getAttribute('data-car')] = span.innerText;
            });

            driversContainer.innerHTML = [1,2,3,4,5,6,7,8].map(i => `
                <div class="driver-row">
                    <span class="car-badge">#${i}</span>
                    <input type="text" class="edit-input" data-car="${i}" value="${existing[i] || ''}" placeholder="Driver name...">
                </div>
            `).join('');

            e.target.innerText = 'SAVE CHANGES';
            e.target.classList.replace('edit-btn', 'save-btn');
        }

        // --- CASE: SAVE BUTTON CLICKED ---
        else if (e.target.classList.contains('save-btn')) {
            const editInputs = raceCard.querySelectorAll('.edit-input');

            const updatedDrivers = Array.from(editInputs)
                .map(input => ({
                    name: input.value.trim(),
                    car: input.getAttribute('data-car')
                }))
                .filter(driver => driver.name !== '');

            const names = updatedDrivers.map(d => d.name);
            const existingError = raceCard.querySelector('.edit-error');
            if (existingError) existingError.remove();

            if (names.length > new Set(names).size) {
                const err = document.createElement('p');
                err.classList.remove('error-shake')
                err.className = 'fd-register-error-msg edit-error error-shake';
                err.innerText = 'No duplicate drivers allowed!';
                raceCard.querySelector('.race-actions').appendChild(err);
                return;
            }

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