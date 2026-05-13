// public/js/components/next-race.js

export const renderNextRace = (container, socket) => {
    container.innerHTML = `
        <div id="nr-screen" style="
            display: flex; flex-direction: column; justify-content: center; align-items: center;
            width: 100vw; height: 100vh; background: #111; color: #fff;
            font-family: sans-serif; text-align: center; padding: 40px; box-sizing: border-box; gap: 30px;
        ">
            <button id="nr-fullscreen-btn" style="
                position: fixed; top: 20px; right: 20px;
                background: rgba(255,255,255,0.15); color: #fff; border: none;
                padding: 10px 20px; border-radius: 8px; font-size: 14px; cursor: pointer;
            ">FULLSCREEN</button>

            <div id="nr-paddock" style="
                display: none;
                background: #FF2121; color: #fff;
                font-size: clamp(18px, 3.5vw, 48px); font-weight: 900; letter-spacing: 4px;
                padding: 20px 60px; border-radius: 20px;
            ">PLEASE PROCEED TO THE PADDOCK</div>

            <div id="nr-title" style="
                font-size: clamp(28px, 6vw, 96px); font-weight: 900; letter-spacing: 6px;
            ">LOADING...</div>

            <div id="nr-drivers" style="
                display: grid; grid-template-columns: repeat(2, 1fr);
                gap: 16px; width: 100%; max-width: 960px;
            "></div>
        </div>
    `;

    const paddockEl = container.querySelector('#nr-paddock');
    const titleEl = container.querySelector('#nr-title');
    const driversEl = container.querySelector('#nr-drivers');
    const fullscreenBtn = container.querySelector('#nr-fullscreen-btn');

    fullscreenBtn.addEventListener('click', () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            fullscreenBtn.innerText = 'EXIT FULLSCREEN';
        } else {
            document.exitFullscreen();
            fullscreenBtn.innerText = 'FULLSCREEN';
        }
    });

    let currentRaceState = {};
    let upcomingRaces = [];

    const render = () => {
        const { lifecycle, nextRaceData } = currentRaceState;

        let displayRace = null;
        let showPaddock = false;

        if (lifecycle === 'race_ready') {
            displayRace = nextRaceData || null;
        } else if (lifecycle === 'race_on') {
            // Once the race starts, switch to the SUBSEQUENT session
            displayRace = upcomingRaces[0] || null;
        } else if (lifecycle === 'race_finished') {
            // Show the just-finished session's drivers and tell them to go to the paddock
            displayRace = nextRaceData || null;
            showPaddock = true;
        }

        paddockEl.style.display = showPaddock ? 'block' : 'none';

        if (!displayRace) {
            titleEl.innerText = 'NO UPCOMING RACES';
            driversEl.innerHTML = '';
            return;
        }

        titleEl.innerText = displayRace.name ? displayRace.name.toUpperCase() : 'NEXT RACE';

        driversEl.innerHTML = displayRace.drivers.map(d => `
            <div style="
                background: #222; border-radius: 12px; padding: 20px 28px;
                font-size: clamp(14px, 2.2vw, 32px); font-weight: 700; letter-spacing: 2px;
                text-align: left;
            ">CAR ${d.car} &mdash; ${d.name.toUpperCase()}</div>
        `).join('');
    };

    socket.emit('get_current_state', (state) => {
        currentRaceState = state;
        if (state.upcomingRaces) upcomingRaces = state.upcomingRaces;
        render();
    });

    socket.on('race_status_changed', (state) => {
        currentRaceState = state;
        render();
    });

    socket.on('updateRaces', (races) => {
        upcomingRaces = races;
        render();
    });
};
