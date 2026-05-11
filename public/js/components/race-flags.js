// public/js/components/race-flags.js

export const renderRaceFlags = (container, socket) => {
    container.innerHTML = `
        <div id="flag-fullscreen" style="display: flex; justify-content: center; align-items: center; width: 100vw; height: 100vh; position: fixed; top: 0; left: 0; z-index: 9999; transition: background-color 0.2s;">
            <h1 id="flag-text" style="font-size: 12vw; font-weight: 900; text-transform: uppercase; text-shadow: 0px 10px 30px rgba(0,0,0,0.5); text-align: center; padding: 20px 60px; border-radius: 30px; letter-spacing: 5px;">
                LOADING
            </h1>
        </div>
    `;

    const flagBg = container.querySelector('#flag-fullscreen');
    const flagText = container.querySelector('#flag-text');

    const updateFlagUI = (state) => {
        // Fallback to Danger if safety isn't defined yet
        const safety = state.safety || 'Danger';

        // Reset the background image (removes the chequered pattern by default)
        flagBg.style.background = 'none';
        flagText.style.backgroundColor = 'transparent';

        if (state.lifecycle === 'race_finished') {
            // THE CHEQUERED FLAG
            flagBg.style.background = "repeating-conic-gradient(#000 0% 25%, #fff 0% 50%) 50% / 100px 100px";
            flagText.style.color = '#ffffff';
            flagText.innerText = 'FINISH';
            // Add a dark box behind the text so it is readable over the black & white squares
            flagText.style.backgroundColor = 'rgba(0,0,0,0.8)';
            
        } else if (safety === 'Safe') {
            flagBg.style.backgroundColor = '#47FF4D'; // Green
            flagText.style.color = '#000000';
            flagText.innerText = 'CLEAR';
            
        } else if (safety === 'Hazard') {
            flagBg.style.backgroundColor = '#F7FF12'; // Yellow
            flagText.style.color = '#000000';
            flagText.innerText = 'HAZARD';
            
        } else if (safety === 'Danger') {
            flagBg.style.backgroundColor = '#FF2121'; // Red
            flagText.style.color = '#ffffff';
            flagText.innerText = 'DANGER';
        }
    };

    // Ask the server for the current flag immediately on load
    socket.emit('get_current_state', updateFlagUI);

    // Listen for the Safety Official clicking a button
    socket.on('race_status_changed', updateFlagUI);
};