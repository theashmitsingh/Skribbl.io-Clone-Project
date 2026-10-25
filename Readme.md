# Skribbl.io Clone

This is a multiplayer drawing and guessing game inspired by Skribbl.io. Players can create a room, invite their friends using a room code, and play together.

One player draws a word, and the other players try to guess it. Players get points for guessing the correct word, and the player with the highest score wins.

## Features

- Create a room and set the game settings.
- Join a room using its room code.
- Play with multiple players in real time.
- Draw on a canvas using different colors and brush sizes.
- Choose a word to draw from the given options.
- Guess words through the chat.
- Get points for correct guesses.
- See the timer and current scores.
- View the final scores when the game ends.

## Technologies Used

**Frontend**
- Next.js
- React.js
- TypeScript
- Tailwind CSS

**Backend**
- Node.js
- Express.js
- Socket.IO
- JavaScript

**Other Tools**
- HTML Canvas
- Nano ID

## How to Run the Project

### 1. Clone the Repository

```bash
git clone https://github.com/theashmitsingh/Skribbl.io-Clone-Project.git
cd Skribble.io-Clone-Project
```

### 2. Start the Backend

Open a terminal and go to your backend folder.

```bash
cd backend
npm install
node src/main.js
```

The backend runs on port `4000` by default.
Deployed Backend Link (Render) - https://skribbl-io-clone-project.onrender.com

### 3. Start the Frontend

Open another terminal and go to your frontend folder.

```bash
cd frontend
npm install
npm run dev
```

Now open the local URL shown in your terminal, `http://localhost:3000`.
Deployed Frontend Link (Vercel) - https://client-five-flame-32.vercel.app

Make sure the frontend is connected to the correct backend URL.

## How to Play

1. Create a room and choose the game settings.
2. Share the room code with your friends.
3. Other players can join using that code.
4. The drawer chooses a word from the given options.
5. The drawer draws the word, while other players try to guess it.
6. Players earn points for correct guesses.
7. After all rounds are finished, the player with the highest score wins.

## Project Structure

The backend code is divided into separate files to keep things organized.

- `Participant.js` stores player details and scores.
- `GameSession.js` manages the game, rounds, timers, drawing, and scoring.
- `SessionEngine.js` creates rooms and manages game sessions.
- `main.js` handles the server and communication between players.

## What I Learned

While building this project, I practised:

- Working with React and Next.js.
- Using Socket.IO for real-time communication.
- Building a multiplayer game.
- Using classes and objects in JavaScript.
- Managing rooms, players, and game settings.
- Working with the HTML Canvas for drawing.
- Handling events between the frontend and backend.

## Future Improvements

- Lobby and player management
- Add more drawing tools and colors.
- Improve the game on mobile devices.
- Allow players to reconnect after losing their connection.
- Save player scores and game history.

## Author

**Ashmit Singh**

Built as a learning project to practise full-stack web development and real-time multiplayer features.
