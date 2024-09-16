const express = require("express");
const socket = require("socket.io");
const http = require("http");

const app = express();
const cors = require("cors");
app.use(cors());

const PORT = process.env.PORT || 3000;
const server = http.createServer(app);

// Set static folder
app.use(express.static("public"));

// Socket setup
const io = socket(server);

// Players and Spectators arrays
let players = [];
let spectators = [];
let currentTurn = 0;
io.on("connection", (socket) => {
  console.log("Made socket connection", socket.id);

  socket.on("join", (data) => {
    if (players.length < 4) {
      // Add player if less than 4 players
      players.push(data);
      socket.emit("playerStatus", {
        status: "player",
        playerId: players.length - 1,
        turn: currentTurn,
      });
      io.sockets.emit("join", data);
    } else {
      // Add as spectator if 4 players already present
      spectators.push(socket.id);
      socket.emit("playerStatus", { status: "spectator" });
    }
  });

  socket.on("joined", () => {
    socket.emit("joined", players);
  });

  socket.on("rollDice", (data) => {
    players[data.id].pos = data.pos;
    const nextTurn =
      data.num != 6 ? (data.id + 1) % players.length : currentTurn;
    currentTurn = nextTurn;
    io.sockets.emit("rollDice", data, nextTurn);
  });

  socket.on("restart", () => {
    players = [];
    currentTurn = 0;
    io.sockets.emit("restart");
  });

  socket.on("disconnect", () => {
    // Remove player or spectator from the lists on disconnect
    players = players.filter((player) => player.id !== socket.id);
    spectators = spectators.filter((spectator) => spectator !== socket.id);
    // Adjust turn if the current player disconnected
    if (
      currentTurn ===
      players.findIndex((player) => player.socketId === socket.id)
    ) {
      currentTurn = (currentTurn + 1) % players.length;
      io.sockets.emit(
        "rollDice",
        { id: null, num: null, pos: null },
        currentTurn
      );
    }
  });
});

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
