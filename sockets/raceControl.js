module.exports = function setupRaceControl(io, raceState) {

    io.on("connection", (socket) => {

        socket.on("startRace", () => {

            if (!raceState.upcomingSession) return;

            raceState.currentSession = raceState.upcomingSession;
            raceState.upcomingSession = null;

            raceState.mode = "SAFE";

            io.emit("raceState", raceState);
        });

        socket.on("setMode", (mode) => {

            const validModes = ["SAFE", "HAZARD", "DANGER", "FINISHED"];
            if (!validModes.includes(mode)) return;

            raceState.mode = mode;

            io.emit("raceState", raceState);
        });

        socket.on("finishRace", () => {

            raceState.mode = "FINISHED";

            io.emit("raceState", raceState);
        });

        socket.on("endSession", () => {

            raceState.mode = "DANGER";

            raceState.currentSession = null;

            io.emit("raceState", raceState);
        });

    });
};