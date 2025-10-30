const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const path = require('path');
const cors = require('cors'); // <-- 1. THE FIX: Import cors

const app = express();
app.use(cors()); // <-- 2. THE FIX: Tell Express to use cors

const server = http.createServer(app);

// 3. THE FIX: Tell Socket.io to allow all origins
const io = new Server(server, {
  cors: {
    origin: "*", // This allows connections from ANY website
    methods: ["GET", "POST"]
  }
});

// Serve your static files (index.html, script.js, style.css)
app.use(express.static(path.join(__dirname, '')));

// Store game states
const games = {};

// Handle client connection
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // User wants to create a new room
  socket.on('createRoom', () => {
    console.log('SERVER: Received "createRoom" event from a client.');
    const roomID = Math.random().toString(36).substring(2, 7); 
    socket.join(roomID);
    console.log('SERVER: Sending "roomCreated" event back with ID:', roomID);
    
    // Initialize game state
    games[roomID] = {
      team1: { score: 0, words: [], letter: "" },
      team2: { score: 0, words: [], letter: "" },
      currentTurn: 1
    };
    
    socket.emit('roomCreated', roomID);
  });

  // User wants to join an existing room
  socket.on('joinRoom', (roomID) => {
    if (!games[roomID]) {
      socket.emit('errorMsg', 'Room not found');
      return;
    }
    socket.join(roomID);
    socket.emit('gameStateUpdate', games[roomID]);
    socket.to(roomID).emit('userJoined', 'A new user has joined the room.');
  });

  // User set their letters
  socket.on('setLetters', (data) => {
    const { roomID, team1Letter, team2Letter } = data;
    if (games[roomID]) {
      games[roomID].team1.letter = team1Letter;
      games[roomID].team2.letter = team2Letter;
      io.to(roomID).emit('gameStateUpdate', games[roomID]);
    }
  });

  // User spoke a word
  socket.on('speakWord', (data) => {
    const { roomID, word, teamNumber } = data;
    const game = games[roomID];

    if (!game) return; 

    const teamData = (teamNumber === "1") ? game.team1 : game.team2;
    const otherTeamData = (teamNumber === "1") ? game.team2 : game.team1;

    let message = "";
    let messageType = "success";

    if (parseInt(teamNumber) !== game.currentTurn) {
        return; 
    }

    if (!word.startsWith(teamData.letter)) {
      teamData.score--;
      message = `❌ "${word}" ખોટો છે, "${teamData.letter}" થી શરૂ થતો નથી!`;
      messageType = "error";
    } else if (teamData.words.includes(word) || otherTeamData.words.includes(word)) {
      teamData.score--;
      message = `⚠️ "${word}" પહેલાથી બોલાયું છે!`;
      messageType = "warning";
    } else {
      teamData.score++;
      teamData.words.push(word);
      message = `🎉 અભિનંદન! "${word}" સ્વીકારવામાં આવ્યું ✅`;
      messageType = "success";
    }

    game.currentTurn = (game.currentTurn === 1) ? 2 : 1;
    io.to(roomID).emit('gameStateUpdate', game);
    io.to(roomID).emit('showMessage', { msg: message, type: messageType });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
