// public/js/components/race-countdown.js

export const renderCountdown = (container, socket) => {
    container.innerHTML = `
        <div class="rc-layout" style="display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100vh;">
            <button id="cd-fullscreen-btn" style="
                position: fixed; top: 20px; right: 20px;
                background: rgba(255,255,255,0.15); color: #fff; border: none;
                padding: 10px 20px; border-radius: 8px; font-size: 14px; cursor: pointer;
            ">FULLSCREEN</button>
            <div id="countdown-status" style="background-color: #96CAFF; color: #000; font-size: 48px; font-weight: 900; padding: 20px 60px; border-radius: 20px; margin-bottom: 20px; transition: background-color 0.3s;">
                TRACK STATUS: LOADING...
            </div>
            <div id="countdown-timer" style="font-size: 300px; font-weight: 900; font-variant-numeric: tabular-nums; line-height: 1; text-shadow: 0 15px 30px rgba(0,0,0,0.5);">
                --:--
            </div>
        </div>
    `;

    const statusBadge = container.querySelector('#countdown-status');
    const timerDisplay = container.querySelector('#countdown-timer');
    const fullscreenBtn = container.querySelector('#cd-fullscreen-btn');

    fullscreenBtn.addEventListener('click', () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            fullscreenBtn.innerText = 'EXIT FULLSCREEN';
        } else {
            document.exitFullscreen();
            fullscreenBtn.innerText = 'FULLSCREEN';
        }
    });

    let raceLifecycle = 'idle';
    let trackSafety = 'Safe';
    let startTime = null;
    let raceDuration = 600000; // Default 10 minutes
    let timerInterval;

    // --- THE MATH ENGINE ---
    const updateTimer = () => {
        // PRO-TIP: If the user navigates away, stop the loop to save memory!
        if (!document.contains(timerDisplay)) {
            clearInterval(timerInterval);
            return;
        }

        if (raceLifecycle === 'race_finished') {
            timerDisplay.innerText = '00:00';
            timerDisplay.style.color = '#FF2121'; // Turn red
            return;
        }

        if (raceLifecycle !== 'race_on' || !startTime) {
            // Show starting time if we are waiting for the safety official to start it
            const mins = Math.floor(raceDuration / 60000);
            timerDisplay.innerText = `${mins.toString().padStart(2, '0')}:00`;
            timerDisplay.style.color = '#ffffff';
            return;
        }

        // Calculate time left
        const now = Date.now();
        const elapsed = now - startTime;
        const remaining = Math.max(0, raceDuration - elapsed);

        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);

        timerDisplay.innerText = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        // Visual cue for time up
        if (remaining === 0) {
            timerDisplay.style.color = '#FF2121';
        } else {
            timerDisplay.style.color = '#ffffff';
        }
    };

    const updateUI = (state) => {
        raceLifecycle = state.lifecycle;
        trackSafety = state.safety;
        startTime = state.startTime;
        
        // If the backend sends a specific duration (like 1 min for Dev Mode), use it
        if (state.durationMs) raceDuration = state.durationMs;

        statusBadge.innerText = `TRACK STATUS: ${trackSafety.toUpperCase()}`;

        // Color code the banner based on safety
        const colors = { 'Safe': '#47FF4D', 'Hazard': '#F7FF12', 'Danger': '#FF2121', 'Finished': '#000000' };
        statusBadge.style.backgroundColor = colors[trackSafety] || '#96CAFF';

        updateTimer();
    };

    // Ask server for initial state on load
    socket.emit('get_current_state', updateUI);

    // Listen for the Safety Official or Receptionist changing the state
    socket.on('race_status_changed', updateUI);

    // Start the high-speed loop
    clearInterval(timerInterval);
    timerInterval = setInterval(updateTimer, 100); 
};