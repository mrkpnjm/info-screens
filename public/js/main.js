// public/js/main.js
import { renderMainView } from './components/main-view.js';
import { renderFrontDesk } from './components/front-desk.js';
import { renderLapTracker } from './components/lap-tracker.js';
import { renderRaceControl } from './components/race-control.js';

const socket = io();
const app = document.getElementById('app');

const routes = {
    '/': renderMainView,
    '/front-desk': renderFrontDesk,
    '/lap-line-tracker': renderLapTracker,
    '/race-control': renderRaceControl
};

const router = () => {
    const path = window.location.pathname;
    const renderFn = routes[path] || renderMainView; 
    app.innerHTML = ''; 
    renderFn(app, socket); 
};

// Make navigation globally available to break the import loop!
window.navigateTo = (url) => {
    history.pushState(null, null, url); 
    router(); 
};

window.addEventListener('popstate', router);
router(); 

socket.on('connect', () => {
    console.log('Connected to Racetrack Server with ID:', socket.id);
});

// Global navigation: Click the logo to return to the Main Menu
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('brand')) {
        window.navigateTo('/');
    }
});

document.addEventListener('mouseover', (e) => {
    if (e.target.classList.contains('brand')) {
        e.target.style.cursor = 'pointer';
    }
});