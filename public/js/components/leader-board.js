// public/js/components/leader-board.js

export const renderLeaderboard = (container, socket) => {
    container.innerHTML = `
        <div class="rc-layout">
            <div class="header-row">
                <h1 class="brand">Racetrack MVP</h1>
                <h2 class="page-title">LIVE LEADERBOARD</h2>
            </div>
            
            <div class="ongoing-race-box" style="width: 100%; max-width: 1000px; margin: 0 auto;">
                <div style="display: flex; justify-content: space-between; width: 100%; align-items: center; margin-bottom: 20px;">
                    <h2 class="ongoing-box-title" id="lb-race-name" style="color: #ffffff;">NO RACE</h2>
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <span style="font-size: 24px; font-weight: 900;">FLAG:</span>
                        <div id="lb-flag-color" class="flag-circle" style="width: 40px; height: 40px;"></div>
                    </div>
                </div>

                <table style="width: 100%; text-align: left; font-size: 24px; font-weight: 900; border-collapse: collapse;">
                    <thead>
                        <tr style="color: #a0a0b0; font-size: 18px; border-bottom: 2px solid #383838;">
                            <th style="padding: 15px 0;">POS</th>
                            <th style="padding: 15px 0;">DRIVER</th>
                            <th style="padding: 15px 0;">CAR</th>
                            <th style="padding: 15px 0;">LAPS</th>
                            <th style="padding: 15px 0;">FASTEST LAP</th>
                        </tr>
                    </thead>
                    <tbody id="lb-body">
                        </tbody>
                </table>
            </div>
        </div>
    `;

    const tbody = container.querySelector('#lb-body');
    const flagCircle = container.querySelector('#lb-flag-color');
    const raceNameTitle = container.querySelector('#lb-race-name');

    let currentCars = {};
    let driverMap = {}; // Maps car numbers to driver names!

    const renderTable = () => {
        tbody.innerHTML = '';
        
        // Convert object to array and sort by fastest lap (nulls at the bottom)
        const sorted = Object.keys(currentCars).map(carNum => ({
            carNum,
            driverName: driverMap[carNum] || 'Unknown',
            ...currentCars[carNum]
        })).sort((a, b) => {
            if (!a.fastestLap) return 1;
            if (!b.fastestLap) return -1;
            return a.fastestLap - b.fastestLap;
        });

        sorted.forEach((car, index) => {
            tbody.innerHTML += `
                <tr style="border-bottom: 1px solid #383838;">
                    <td style="padding: 20px 0; color: ${index === 0 ? '#47FF4D' : '#fff'};">${index + 1}</td>
                    <td style="padding: 20px 0;">${car.driverName.toUpperCase()}</td>
                    <td style="padding: 20px 0; color: #4096A6;">#${car.carNum}</td>
                    <td style="padding: 20px 0;">${car.currentLap}</td>
                    <td style="padding: 20px 0;">${car.fastestLap ? (car.fastestLap/1000).toFixed(3) + 's' : '--'}</td>
                </tr>
            `;
        });
    };

    const updateDisplay = (state) => {
        // Update Flag
        const colors = { 'Safe': '#47FF4D', 'Hazard': '#F7FF12', 'Danger': '#FF2121', 'Finished': '#000000' };
        flagCircle.style.backgroundColor = colors[state.safety] || '#FF2121';

        // Update Title and build driver map
        if (state.lifecycle === 'race_on' || state.lifecycle === 'race_finished') {
            raceNameTitle.innerText = state.raceName;
            if (state.nextRaceData && state.nextRaceData.drivers) {
                state.nextRaceData.drivers.forEach(d => {
                    driverMap[d.car] = d.name;
                });
            }
            currentCars = state.cars || {};
        } else {
            raceNameTitle.innerText = "WAITING FOR NEXT RACE";
            currentCars = {};
        }
        renderTable();
    };

    // Ask for initial state
    socket.emit('get_current_state', updateDisplay);

    // Listen for global state changes
    socket.on('race_status_changed', updateDisplay);

    // Listen for live lap updates
    socket.on('lap_updated', (data) => {
        if (currentCars[data.carNumber]) {
            currentCars[data.carNumber].currentLap = data.currentLap;
            currentCars[data.carNumber].fastestLap = data.fastestLap;
            renderTable();
        }
    });
};