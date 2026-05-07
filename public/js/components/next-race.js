export const renderNextRace = (container, socket) => {

    container.innerHTML = `
        <div class="view-container">
            <h1>Next Race</h1>

            <ul id="driverList"></ul>

            <button id="startRaceBtn">Start Race</button>
        </div>
    `;

    const driverList = document.getElementById('driverList');
    const startBtn = document.getElementById('startRaceBtn');

    socket.on('raceState', (raceState) => {

        const session = raceState.upcomingSession;
        if (!session) return;

        driverList.innerHTML = '';

        session.drivers.forEach(d => {
            const li = document.createElement('li');
            li.textContent = `${d.name} - Car ${d.car}`;
            driverList.appendChild(li);
        });
    });

    startBtn.addEventListener('click', () => {
        socket.emit('startRace');
    });
};