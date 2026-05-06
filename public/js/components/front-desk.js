import { navigateTo } from "../main.js";

export const renderFrontDesk = (container, socket) => {
    // Structural template for the Front Desk view
    container.innerHTML = `
        <div class="view-container">
            <h2>Driver Registration</h2>
            <div class="form-card">
                <input type="text" id="driverOneName" placeholder="Driver's Name">
                <input type="text" id="driverTwoName">
                <button id="registerBtn">Register a Race</button>
            </div>
            <div id="raceList"></div>
            <button class="secondary" id="backBtn">Back to Main Menu</button>
        </div>
    `;

    // Interactivity for the registration form
    const addBtn = document.getElementById('registerBtn');
    const backBtn = document.getElementById('backBtn');
    const nameInput1 = document.getElementById('driverOneName');
    const nameInput2 = document.getElementById('driverTwoName');

    addBtn.addEventListener('click', () => {
        const raceData = {
            driver1: nameInput1.value,
            driver2: nameInput2.value
        };

        if (raceData.driver1 && raceData.driver2) {
            // Logic for registering the race
            socket.emit('addRace', raceData);
            nameInput1.value = '';
            nameInput2.value = '';
        }
    });

    backBtn.addEventListener('click', () => {
        // Logic to go back to the main menu
        navigateTo('/');
    });
}