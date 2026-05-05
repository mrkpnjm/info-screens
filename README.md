# info-screens

## Project Overview
This is the Minimum Viable Product (MVP) for the Beachside Racetrack management system. It provides real-time interfaces for racetrack employees to control race sessions, and public displays for drivers and spectators to view live race data.

The server is built with **Node.js**, **Express**, and **Socket.IO** to ensure all updates happen instantly without page polling.

## Setup and Installation

1. **Clone the repository** to your local machine.
2. **Install dependencies:** Open your terminal in the project folder and run:
   ```bash
   npm install
## Environment Variables

1. Locate the .env.example file in the root directory.
2. Create a new file named exactly .env in the same directory.
3. Copy the keys from .env.example into your new .env file and assign them secure passwords.

   ```bash
    receptionist_key=your_password_here
    observer_key=your_password_here
    safety_key=your_password_here

## Starting the server

1. Production Mode (10-Minute Race Timer)
   ```bash
   npm npm start
2. Development Mode (1-Minute Race Timer)
   ```bash
   npm run dev
Once running, the server will be accessible at http://localhost:3000