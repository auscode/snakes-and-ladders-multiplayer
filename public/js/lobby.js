document.addEventListener("DOMContentLoaded", () => {
  const socket = io.connect(window.location.origin);

  const createRoomBtn = document.getElementById("createRoomBtn");
  const roomNameInput = document.getElementById("roomName");
  const roomsList = document.getElementById("roomsList");
  const inviteLinkDiv = document.getElementById("inviteLink");

  // Create room
  createRoomBtn.addEventListener("click", () => {
    const roomName = roomNameInput.value;
    if (roomName) {
      socket.emit("createRoom", roomName);
    }
  });

  // Display the generated invite link (only open when clicked)
  socket.on("roomCreated", (roomName) => {
    const inviteLink = `${window.location.origin}/index.html?room=${roomName}`;
    inviteLinkDiv.innerHTML = `<p>${roomName} = <a href="${inviteLink}" target="_blank">${inviteLink}</a></p>`;

    // Fetch updated room list
    socket.emit("getRooms");
  });

  // Fetch existing rooms
  socket.emit("getRooms");

  // Display rooms and allow users to open them in a new tab
  socket.on("roomsList", (rooms) => {
    roomsList.innerHTML = rooms
      .map(
        (room) =>
          `<li><a href="index.html?room=${room}" target="_blank">${room}</a></li>`
      )
      .join("");
  });
});
