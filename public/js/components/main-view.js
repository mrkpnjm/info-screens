// public/js/components/main-view.js
// NO IMPORTS AT THE TOP!

export const renderMainView = (container, socket) => {
    container.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; padding: 40px;">
            <h1 style="color: #4096A6; font-size: 56px; font-weight: 900; margin-bottom: 5px;">Beachside Racetrack</h1>
            <h2 style="color: #C57979; font-size: 24px; font-weight: 900; margin-bottom: 50px; letter-spacing: 2px;">SYSTEM LAUNCHPAD</h2>
            
            <div style="display: flex; gap: 60px; width: 100%; max-width: 1000px; justify-content: center;">
                
                <div style="background: #1a1a1a; padding: 40px; border-radius: 15px; border-top: 5px solid #4096A6; flex: 1; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
                    <h3 style="color: #fff; font-size: 24px; text-align: center; margin-top: 0; margin-bottom: 30px;">EMPLOYEE TOOLS</h3>
                    <div style="display: flex; flex-direction: column; gap: 20px;">
                        <button id="navFrontDesk" style="padding: 18px; font-size: 20px; font-weight: 900; background: #4499b8; border: none; border-radius: 8px; cursor: pointer; text-transform: uppercase;">Front Desk</button>
                        <button id="navRaceControl" style="padding: 18px; font-size: 20px; font-weight: 900; background: #4499b8; border: none; border-radius: 8px; cursor: pointer; text-transform: uppercase;">Race Control</button>
                        <button id="navLapTracker" style="padding: 18px; font-size: 20px; font-weight: 900; background: #4499b8; border: none; border-radius: 8px; cursor: pointer; text-transform: uppercase;">Lap-Line Tracker</button>
                    </div>
                </div>

                <div style="background: #1a1a1a; padding: 40px; border-radius: 15px; border-top: 5px solid #C57979; flex: 1; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
                    <h3 style="color: #fff; font-size: 24px; text-align: center; margin-top: 0; margin-bottom: 30px;">PUBLIC DISPLAYS</h3>
                    <div style="display: flex; flex-direction: column; gap: 20px;">
                        <a href="/leader-board" target="_blank" style="padding: 18px; font-size: 20px; font-weight: 900; background: #383838; color: #fff; text-decoration: none; text-align: center; border-radius: 8px; text-transform: uppercase;">Live Leaderboard</a>
                        <a href="/next-race" target="_blank" style="padding: 18px; font-size: 20px; font-weight: 900; background: #383838; color: #fff; text-decoration: none; text-align: center; border-radius: 8px; text-transform: uppercase;">Next Race (Paddock)</a>
                        <a href="/race-countdown" target="_blank" style="padding: 18px; font-size: 20px; font-weight: 900; background: #383838; color: #fff; text-decoration: none; text-align: center; border-radius: 8px; text-transform: uppercase;">Countdown Timer</a>
                        <a href="/race-flags" target="_blank" style="padding: 18px; font-size: 20px; font-weight: 900; background: #383838; color: #fff; text-decoration: none; text-align: center; border-radius: 8px; text-transform: uppercase;">Track Flags</a>
                    </div>
                </div>

            </div>
        </div>
    `;

    document.getElementById('navFrontDesk').addEventListener('click', () => window.navigateTo('/front-desk'));
    document.getElementById('navRaceControl').addEventListener('click', () => window.navigateTo('/race-control'));
    document.getElementById('navLapTracker').addEventListener('click', () => window.navigateTo('/lap-line-tracker'));
};