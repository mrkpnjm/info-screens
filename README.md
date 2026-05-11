# info-screens

## Project Overview
This is the Minimum Viable Product (MVP) for the Beachside Racetrack management system. It provides real-time interfaces for racetrack employees to control race sessions, and public displays for drivers and spectators to view live race data.

The server is built with **Node.js**, **Express**, and **Socket.IO** to ensure all updates happen instantly without page polling.

## Setup and Installation

1. **Clone the repository** to your local machine.
2. **Install dependencies:** Open your terminal in the project folder and run:
   ```bash
   npm install
   ```

## Environment Variables

1. Locate the `.env.example` file in the root directory.
2. Create a new file named exactly `.env` in the same directory.
3. Copy the keys from `.env.example` into your new `.env` file and assign them secure passwords.

   ```bash
   receptionist_key=your_password_here
   observer_key=your_password_here
   safety_key=your_password_here
   ```

## Starting the Server

1. Production Mode (10-Minute Race Timer)
   ```bash
   npm start
   ```
2. Development Mode (1-Minute Race Timer)
   ```bash
   npm run dev
   ```

Once running, the server will be accessible at `http://localhost:3000`

## User Guide

### Front Desk — `/front-desk`
Used by the **Receptionist**. Requires an access code to log in.
- Register new race sessions by entering driver names into the car slots and clicking **Register a Race**.
- View all upcoming races in the list on the right.
- Click **Edit Race** on any upcoming race to change driver names, then **Save Changes**.
- Click **Delete Race** to remove an upcoming session.
- Races that are loaded into Race Control are no longer shown here.

### Race Control — `/race-control`
Used by the **Safety Official**. Requires an access code to log in.
- When an upcoming race is ready, press **Start Race** to begin the session. The flag changes to Safe and the timer starts.
- During a race, use the **Safe**, **Hazard**, and **Danger** buttons to change the track flag mode.
- Press **Finish** when the race time is up to trigger the chequered flag and stop the timer.
- Press **End Session** to close the session and load the next race.

### Lap-Line Tracker — `/lap-line-tracker`
Used by the **Lap-Line Observer**. Requires an access code to log in.
- During a race, a large button appears for each car on track.
- Tap the button for a car exactly as it crosses the finish line to record the lap.
- The first tap starts the stopwatch for that car. Subsequent taps record lap times.
- Buttons are disabled when the track is under a Danger flag.

### Leader Board — `/leader-board`
Public display for **Guests**. No access code required.
- Shows live standings ordered by fastest lap time.
- Displays each driver's name, car number, current lap count, and fastest lap time.
- Shows the remaining race time and current flag colour.

### Next Race — `/next-race`
Public display for **Race Drivers**. No access code required.
- Shows the name and driver list for the upcoming race session.
- Switches to the next session automatically once the current race starts.
- Displays a **"Please Proceed to the Paddock"** message when the current race has finished.

### Race Countdown — `/race-countdown`
Public display for **Race Drivers**. No access code required.
- Shows the remaining time in the current race as a large countdown timer.
- Displays the current track status (Safe, Hazard, Danger).

### Race Flags — `/race-flags`
Public display for **Race Drivers**. No access code required.
- Full-screen colour display showing the current flag:
  - **Green** — Safe
  - **Yellow** — Hazard
  - **Red** — Danger
  - **Chequered** — Race Finished
