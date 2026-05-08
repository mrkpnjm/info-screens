export const renderNextRace = (container, socket) => {

    container.innerHTML = `
    <div class="view-container">
        <h1 class="title">Next Race</h1>

        <ul id="driverList" class="driver-list"></ul>

        <button id="startRaceBtn" class="primary-btn">
            Start Race
        </button>
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