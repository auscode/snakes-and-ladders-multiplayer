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

// Players, Spectators, and Rooms
let players = [];
let spectators = [];
let rooms = {}; // { roomName: { players: [], spectators: [] } }

io.on("connection", (socket) => {
  console.log("Made socket connection", socket.id);

  // Create a room
  socket.on("createRoom", (roomName) => {
    if (!rooms[roomName]) {
      rooms[roomName] = { players: [], spectators: [] };
      socket.join(roomName);
      console.log(`${socket.id} created room: ${roomName}`);
      socket.emit("roomCreated", roomName);

      // Emit the updated rooms list to all clients
      io.emit("roomsList", Object.keys(rooms));
    }
  });

  // Join a room
  socket.on("joinRoom", (roomName, playerData) => {
    if (rooms[roomName] && rooms[roomName].players.length < 4) {
      rooms[roomName].players.push(playerData);
      socket.join(roomName);
      socket.emit("playerStatus", { status: "player", roomName });
      io.to(roomName).emit("playerJoined", playerData);
    } else if (rooms[roomName]) {
      rooms[roomName].spectators.push(socket.id);
      socket.join(roomName);
      socket.emit("playerStatus", { status: "spectator", roomName });
    }
  });

  // Send the list of available rooms
  socket.on("getRooms", () => {
    socket.emit("roomsList", Object.keys(rooms));
  });

  // Handle dice roll
  socket.on("rollDice", (data) => {
    players[data.id].pos = data.pos;
    const turn = data.num != 6 ? (data.id + 1) % players.length : data.id;
    io.sockets.emit("rollDice", data, turn);
  });

  // Handle restart
  socket.on("restart", () => {
    players = [];
    io.sockets.emit("restart");
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    for (const roomName in rooms) {
      // Remove the player or spectator from the room
      rooms[roomName].players = rooms[roomName].players.filter(
        (player) => player.id !== socket.id
      );
      rooms[roomName].spectators = rooms[roomName].spectators.filter(
        (spectator) => spectator !== socket.id
      );

      // If no players are left, delete the room
      if (rooms[roomName].players.length === 0) {
        delete rooms[roomName];
        console.log(`Room ${roomName} deleted`);
      }
    }

    // Emit the updated rooms list to all clients
    io.emit("roomsList", Object.keys(rooms));
  });
});

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
