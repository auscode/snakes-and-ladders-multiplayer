// document.addEventListener("DOMContentLoaded", () => {
//   // Making Connection
//   const socket = io.connect("http://localhost:3000");
//   // const socket = io.connect(process.env.);
//   socket.emit("joined");
document.addEventListener("DOMContentLoaded", () => {
  // const socket = io.connect("http://localhost:3000");
  const socket = io.connect(window.location.origin);
  socket.emit("joined");

  let players = [];
  let currentPlayer;
  let playerStatus = "spectator"; // Default status

  let canvas = document.getElementById("canvas");
  canvas.width = document.documentElement.clientHeight * 0.9;
  canvas.height = document.documentElement.clientHeight * 0.9;
  let ctx = canvas.getContext("2d");

  const redPieceImg = "../images/red_piece.png";
  const bluePieceImg = "../images/blue_piece.png";
  const yellowPieceImg = "../images/yellow_piece.png";
  const greenPieceImg = "../images/green_piece.png";

  const side = canvas.width / 10;
  const offsetX = side / 2;
  const offsetY = side / 2 + 20;

  const images = [redPieceImg, bluePieceImg, yellowPieceImg, greenPieceImg];

  const ladders = [
    [2, 23],
    [4, 68],
    [6, 45],
    [20, 59],
    [30, 96],
    [52, 72],
    [57, 96],
    [71, 92],
  ];

  const snakes = [
    [98, 40],
    [84, 58],
    [87, 49],
    [73, 15],
    [56, 8],
    [50, 5],
    [43, 17],
  ];

  class Player {
    constructor(id, name, pos, img) {
      this.id = id;
      this.name = name;
      this.pos = pos;
      this.img = img;
    }

    draw() {
      let xPos =
        Math.floor(this.pos / 10) % 2 === 0
          ? (this.pos % 10) * side - 15 + offsetX
          : canvas.width - ((this.pos % 10) * side + offsetX + 15);
      let yPos = canvas.height - (Math.floor(this.pos / 10) * side + offsetY);

      let image = new Image();
      image.src = this.img;
      ctx.drawImage(image, xPos, yPos, 30, 40);
    }

    updatePos(num) {
      if (this.pos + num <= 99) {
        this.pos += num;
        this.pos = this.isLadderOrSnake(this.pos + 1) - 1;
      }
    }

    isLadderOrSnake(pos) {
      let newPos = pos;
      // Check ladders
      ladders.forEach(([start, end]) => {
        if (start === pos) newPos = end;
      });
      // Check snakes
      snakes.forEach(([start, end]) => {
        if (start === pos) newPos = end;
      });
      return newPos;
    }
  }

  document.getElementById("start-btn").addEventListener("click", () => {
    const name = document.getElementById("name").value;
    if (!name) return; // Ensure name is entered
    document.getElementById("name").disabled = true;
    socket.emit("join", {
      id: players.length,
      name,
      pos: 0,
      img: images[players.length],
    });
  });

  socket.on("playerStatus", (data) => {
    playerStatus = data.status;
    if (playerStatus === "player") {
      currentPlayer = new Player(
        data.playerId,
        document.getElementById("name").value,
        0,
        images[data.playerId]
      );
      document.getElementById("start-btn").hidden = true;
      document.getElementById("roll-button").hidden = false;
    } else {
      document.getElementById("start-btn").hidden = true;
      document.getElementById("roll-button").hidden = true;
      document.getElementById("current-player").innerText =
        "You are watching the game.";
    }
  });

  document.getElementById("roll-button").addEventListener("click", () => {
    if (playerStatus !== "player") return; // Prevent spectators from interacting
    const num = rollDice();
    currentPlayer.updatePos(num);
    socket.emit("rollDice", {
      num,
      id: currentPlayer.id,
      pos: currentPlayer.pos,
    });
  });

  function rollDice() {
    return Math.ceil(Math.random() * 6);
  }

  function drawPins() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    players.forEach((player) => player.draw());
  }

  socket.on("join", (data) => {
    players.push(new Player(players.length, data.name, data.pos, data.img));
    drawPins();
    document.getElementById(
      "players-table"
    ).innerHTML += `<tr><td>${data.name}</td><td><img src=${data.img} height=50 width=40></td></tr>`;
  });

  socket.on("joined", (data) => {
    data.forEach((player, index) => {
      players.push(new Player(index, player.name, player.pos, player.img));
      document.getElementById(
        "players-table"
      ).innerHTML += `<tr><td>${player.name}</td><td><img src=${player.img}></td></tr>`;
    });
    drawPins();
  });

  socket.on("rollDice", (data, turn) => {
    players[data.id].updatePos(data.num);
    document.getElementById("dice").src = `./images/dice/dice${data.num}.png`;
    drawPins();
    if (turn !== currentPlayer.id && playerStatus === "player") {
      document.getElementById("roll-button").hidden = true;
      document.getElementById(
        "current-player"
      ).innerText = `It's ${players[turn].name}'s turn`;
    } else if (playerStatus === "player") {
      document.getElementById("roll-button").hidden = false;
      document.getElementById("current-player").innerText = "It's your turn";
    }
    if (players.some((player) => player.pos === 99)) {
      document.getElementById("roll-button").hidden = true;
      document.getElementById("dice").hidden = true;
      document.getElementById("restart-btn").hidden = false;
      const winner = players.find((player) => player.pos === 99);
      document.getElementById(
        "current-player"
      ).innerText = `${winner.name} has won!`;
    }
  });

  document.getElementById("restart-btn").addEventListener("click", () => {
    socket.emit("restart");
  });
  document.getElementById("restart-btn2").addEventListener("click", () => {
    socket.emit("restart");
  });

  socket.on("restart", () => {
    window.location.reload();
  });
});
