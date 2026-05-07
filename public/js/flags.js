const flagText = document.getElementById("flag-text");

socket.on("raceState", (raceState) => {

    const mode = raceState.mode;

    if (mode === "SAFE") {
        flagText.textContent = "GREEN FLAG";
    }

    else if (mode === "HAZARD") {
        flagText.textContent = "YELLOW FLAG";
    }

    else if (mode === "DANGER") {
        flagText.textContent = "RED FLAG";
    }

    else if (mode === "FINISHED") {
        flagText.textContent = "CHEQUERED FLAG";
    }

});

document.getElementById("safe-btn")
    .addEventListener("click", () => {
        socket.emit("setMode", "SAFE");
    });

document.getElementById("hazard-btn")
    .addEventListener("click", () => {
        socket.emit("setMode", "HAZARD");
    });

document.getElementById("danger-btn")
    .addEventListener("click", () => {
        socket.emit("setMode", "DANGER");
    });

document.getElementById("finish-btn")
    .addEventListener("click", () => {
        socket.emit("setMode", "FINISHED");
    });