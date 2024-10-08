document.addEventListener("DOMContentLoaded", () => {
  // const socket = io.connect("http://localhost:3000");
  const socket = io.connect(window.location.origin);
  socket.emit("joined");

  let players = [];
  let currentPlayer;
  let playerStatus = "spectator"; // Default status
  let isFirstPlayer = false;
  let turn;

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

      const imgWidth = canvas.width / 15;
      const imgHeight = canvas.height / 15;

      ctx.drawImage(image, xPos, yPos, imgWidth, imgHeight);
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
    console.log(players.length + " players");
  });

  socket.on("playerStatus", (data) => {
    playerStatus = data.status;
    currentPlayer = new Player(
      data.playerId,
      data.name,
      0,
      images[data.playerId]
    );
    turn = data.turn;
    document.getElementById("start-btn").hidden = true;

    if (data.turn === data.playerId) {
      document.getElementById("roll-button").hidden = false;
      document.getElementById("current-player").innerText = "It's your turn!";
    } else {
      document.getElementById("roll-button").hidden = true;
      document.getElementById("current-player").innerText = `It's ${
        players[data.turn].name
      }'s turn`;
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
  // #region fxn timerupdate
  function updateTimer(timeLeft) {
    document.getElementById(
      "timer"
    ).innerText = `Next roll in ${timeLeft} seconds...`;
    if (turn !== currentPlayer.id) {
      console.log("turn");
      console.log(turn);
      console.log("currentPlayer.id");
      console.log(currentPlayer.id);
      document.getElementById("roll-button").hidden = true;
      // if (timeLeft === 0){
      //   document.getElementById("roll-button").hidden = true;
      // }
      // } else {
      //   document.getElementById("roll-button").hidden = true;
    }
    console.log("endUpdate timer");
  }

  // #region fxn timerEnd
  function handleTimerEnd() {
    console.log("in handleTiemr End");
    console.log("turn");
    console.log(turn);
    console.log("currentPlayer.id");
    console.log(currentPlayer.id);
    if (turn === currentPlayer.id) {
      console.log("handle timer end in if");
      document.getElementById("roll-button").hidden = false;
    } else {
      document.getElementById("roll-button").hidden = true;
    }
    console.log("end handleTiemr End");
  }
  // #region Socket timerupdate
  socket.on("timerUpdate", (data) => {
    console.log("updating");
    console.log(data);
    updateTimer(data.timeLeft);
    turn = data.turn;

    document.getElementById("roll-button").hidden = true;
    // if (turn !== currentPlayer.id) {
    //   document.getElementById("roll-button").hidden = true;
    // } else {
    //   document.getElementById("roll-button").hidden = false;
    // }
    console.log("updating ed");
  });

  // #region Socket timerEnd
  socket.on("timerEnd", (newTurn) => {
    console.log("end timer");
    handleTimerEnd();
    turn = newTurn;
    console.log("ednde");
  });

  socket.on("join", (data) => {
    players.push(new Player(players.length, data.name, data.pos, data.img));
    drawPins();
    document.getElementById("players-table").innerHTML += `
    <tr id="player-row-${players.length - 1}">
      <td>${data.name}</td>
      <td><img src="${data.img}" class="player-piece-img"></td>
      <td>${data.pos + 1}</td>
    </tr>`;
  });

  socket.on("joined", (data) => {
    data.forEach((player, index) => {
      players.push(new Player(index, player.name, player.pos, player.img));

      // Add player to the table with a unique ID for each row and display their position
      document.getElementById("players-table").innerHTML += `
      <tr id="player-row-${index}">
        <td>${player.name}</td>
        <td><img src="${player.img}" class="player-piece-img"></td>
        <td>${player.pos + 1}</td> <!-- Display 1-based position -->
      </tr>`;
    });
    drawPins();
  });

  socket.on("rollDice", (data, newTurn) => {
    players[data.id].updatePos(data.num);
    document.getElementById("dice").src = `./images/dice/dice${data.num}.png`;
    drawPins();
    turn = newTurn;
    document.querySelector(`#player-row-${data.id} td:last-child`).innerText =
      players[data.id].pos + 1;

    if (turn !== currentPlayer.id && playerStatus === "player") {
      document.getElementById("roll-button").hidden = true;
      document.getElementById(
        "current-player"
      ).innerText = `It's ${players[turn].name}'s turn`;
    } else if (playerStatus === "player") {
      document.getElementById("roll-button").hidden = false;
      document.getElementById("current-player").innerText = "It's your turn!";
    }

    if (players.some((player) => player.pos === 99)) {
      document.getElementById("roll-button").hidden = true;
      document.getElementById("current-player").innerText = `${
        players[data.id].name
      } wins!`;
    }
  });
  if (document.getElementById("restart-btn")){
    document.getElementById("restart-btn").addEventListener("click", () => {
      socket.emit("restart");
    });
  }
  document.getElementById("restart-btn2").hidden = true;
  document.getElementById("restart-btn2").addEventListener("click", () => {
    socket.emit("restart");
  });
  socket.on("maxPlayerLimitReached", () => {
    document.getElementById(
      "current-player"
    ).innerHTML = `Max Player Limit Achieved<br>You can now spectate.😍😍`;
    document.getElementById("start-btn").hidden = true;
    document.getElementById("roll-button").hidden = true;
  });

  socket.on("restart", () => {
    players = [];
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    document.getElementById("players-table").innerHTML = "";
    window.location.reload();
  });
});
