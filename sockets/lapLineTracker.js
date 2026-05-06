module.exports = function setupLapLineTracker(io, raceState) {

    let lastCrossTime = {};

    io.on("connection", (socket) => {

        socket.emit("raceState", raceState);

        socket.on("lapCrossed", (carNumber) => {

            if (!raceState.currentSession) return;
            if (raceState.mode === "FINISHED") return;

            const driver = raceState.currentSession.drivers.find(
                d => d.car === carNumber
            );

            if (!driver) return;

            const now = Date.now();

            if (!lastCrossTime[carNumber]) {
                lastCrossTime[carNumber] = now;
                driver.currentLap = 1;
                io.emit("raceState", raceState);
                return;
            }

            const lapTime = (now - lastCrossTime[carNumber]) / 1000;

            driver.currentLap += 1;

            if (driver.fastestLap === null || lapTime < driver.fastestLap) {
                driver.fastestLap = lapTime;
            }

            lastCrossTime[carNumber] = now;

            io.emit("raceState", raceState);
        });

        socket.on("resetLaps", () => {

            lastCrossTime = {};

            if (!raceState.currentSession) return;

            raceState.currentSession.drivers.forEach(driver => {
                driver.currentLap = 0;
                driver.fastestLap = null;
            });

            io.emit("raceState", raceState);
        });

    });
};