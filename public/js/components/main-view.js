export const renderMainView = (container, socket) => {
    // Structural template for the Main View
    container.innerHTML = `
        <div class="view-container centered">
            <h1>Racetrack MVP</h1>
            <button id="frontDeskBtn">Front Desk</button>
            <!-- Add more role buttons as needed -->
        </div>
    `;

    const frontDeskBtn = document.getElementById('frontDeskBtn');
    
    frontDeskBtn.addEventListener('click', () => {
        // Logic to switch to the Front Desk view
        socket.emit('viewChange', 'frontDesk');
    });
}