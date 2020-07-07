const express = require("express");
const http = require("http");
const app = express();
const server = http.createServer(app);
const socket = require("socket.io");
const io = socket(server);

const users = {};
const socketToRoom = {};
let hostId;
io.on("connection", (socket) => {
  // if (!users[socket.id]) {
  //     users[socket.id] = socket.id;
  // }
  // socket.emit("yourID", socket.id);
  // io.sockets.emit("allUsers", users);
  socket.on("join room", (roomID) => {
    if (users[roomID]) {
      const length = users[roomID].length;
      if (length === 100) {
        socket.emit("room full");
        return;
      }
      users[roomID].push(socket.id);
    } else {
      users[roomID] = [socket.id];
    }

    if (!hostId) {
      hostId = socket.id;
    }
    console.log("hostId----", hostId);
    socketToRoom[socket.id] = roomID;
    socket.emit("yourID", socket.id);
    io.sockets.emit("allUsers", users[roomID]);
  });

  socket.on("disconnect", () => {
    const roomID = socketToRoom[socket.id];
    let room = users[roomID];
    if (room) {
      room = room.filter((id) => id !== socket.id);
      users[roomID] = room;
    }
    io.sockets.emit("allUsers", users[roomID]);
  });

  socket.on("callUser", (data) => {
    io.to(data.userToCall).emit("hey", {
      signal: data.signalData,
      from: data.from,
    });
  });

  socket.on("acceptCall", (data) => {
		console.log('acceptCall-----',data)
    io.to(data.to).emit("callAccepted", data.signal);
  });
});

server.listen(8000, () => console.log("server is running on port 8000"));
