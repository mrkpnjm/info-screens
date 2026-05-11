// public/js/components/front-desk.js
export const renderFrontDesk = (container, socket) => {
    container.innerHTML = `
        <div class="fd-layout" style="padding: 40px 60px;">
            <header class="header-row">
                <h1 class="brand">Racetrack MVP</h1>
                <h2 class="page-title">FRONT DESK</h2>
            </header>

            <div id="fdViewLogin" class="view active">
                <div class="login-container">
                    <div class="login-input-group">
                        <label for="fdAccessKey">Password:</label>
                        <input type="password" id="fdAccessKey">
                    </div>
                    <button id="fdLoginBtn" class="login-btn">LOGIN</button>
                    <p id="fdLoginError" class="error-msg hidden"></p>
                </div>
            </div>

            <div id="fdViewDashboard" class="view hidden" style="display: flex; gap: 100px; width: 100%;">
                
                <div class="registration-side" style="width: 600px; flex-shrink: 0;">
                    <div class="driver-input-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
                        ${[1, 2, 3, 4, 5, 6, 7, 8].map(i => `
                            <div class="driver-input-group">
                                <label style="font-weight: 900; margin-bottom: 5px; display: block;">CAR ${i}</label>
                                <input type="text" class="driver-input" data-car="${i}" placeholder="Driver Name..." style="width: 100%; height: 50px; border-radius: 5px; border: none; padding: 10px; font-size: 18px;">
                            </div>
                        `).join('')}
                    </div>
                    <button id="fdRegisterBtn" style="width: 100%; height: 60px; background: #4499b8; border: none; border-radius: 30px; font-weight: 900; font-size: 18px; cursor: pointer;">REGISTER RACE</button>
                </div>

                <div class="races-display-side" style="flex: 1;">
                    <h2 style="font-size: 28px; margin-top: 0;">UPCOMING RACES</h2>
                    <div id="fdRaceList"></div>
                </div>
            </div>
        </div>
    `;

    const viewLogin = container.querySelector('#fdViewLogin');
    const viewDashboard = container.querySelector('#fdViewDashboard');
    const loginBtn = container.querySelector('#fdLoginBtn');
    const registerBtn = container.querySelector('#fdRegisterBtn');
    const raceList = container.querySelector('#fdRaceList');
    const errorText = container.querySelector('#fdLoginError');

    // --- 1. AUTHENTICATION ---
    loginBtn.addEventListener('click', () => {
        const keyInput = container.querySelector('#fdAccessKey').value;
        errorText.classList.add('hidden');

        socket.emit('authenticate', { role: 'receptionist', key: keyInput }, (response) => {
            if (response.success) {
                viewLogin.classList.replace('active', 'hidden');
                viewDashboard.classList.replace('hidden', 'active');
                
                // Immediately request the current queue so the screen isn't blank
                socket.emit('request_race_queue'); 
            } else {
                errorText.innerText = response.message;
                errorText.classList.remove('hidden');
            }
        });
    });

    // --- 2. REGISTER RACE ---
    registerBtn.addEventListener('click', () => {
        const inputs = container.querySelectorAll('.driver-input');
        const drivers = Array.from(inputs).map(input => input.value.trim()).filter(name => name !== '');
        
        if (drivers.length > 0) {
            socket.emit('registerRace', drivers); 
            inputs.forEach(input => input.value = ''); 
        }
    });

// --- 3. QUEUE RENDERING & ACTIONS ---
    socket.on('updateRaces', (races) => {
        // GHOST LISTENER SHIELD: Check if the race list is actually on the screen!
        const activeRaceList = document.getElementById('fdRaceList');
        if (!activeRaceList) return; 

        if (races.length === 0) {
            activeRaceList.innerHTML = '<p>No upcoming races.</p>';
            return;
        }

        activeRaceList.innerHTML = races.map((race, index) => `
            <div class="fd-race-card" style="background: #383838; padding: 20px; border-radius: 10px; margin-bottom: 15px; border-left: 5px solid #4fa3b8;">
                <h3 style="margin-top:0;">Race ${index + 1}</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px;">
                    ${race.drivers.map(d => `<div><span style="color: #4fa3b8; font-weight: bold;">Car ${d.car}:</span> ${d.name}</div>`).join('')}
                </div>
                <button class="delete-btn" data-id="${race.id}" style="background: #C57979; border: none; padding: 10px 20px; border-radius: 5px; font-weight: bold; cursor: pointer;">DELETE</button>
            </div>
        `).join('');
    });
    // Event delegation for delete buttons
    raceList.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-btn')) {
            socket.emit('deleteRace', Number(e.target.getAttribute('data-id')));
        }
    });
};