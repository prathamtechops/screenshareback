// server.js
const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: "*",
  },
});

app.use(cors());

let connectedUsers = [];
const peerConnections = {};

const updateConnectedUsers = () => {
  io.emit("connectedUsersUpdate", connectedUsers);
};

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);
  connectedUsers.push(socket.id);
  updateConnectedUsers();

  socket.on("startScreenShare", () => {
    console.log(`User ${socket.id} wants to start screen sharing`);
    io.emit("userStartedScreenShare", socket.id);
  });

  socket.on("stopScreenShare", () => {
    console.log(`User ${socket.id} stopped screen sharing`);
    io.emit("userStoppedScreenShare", socket.id);
  });

  socket.on("iceCandidate", (data) => {
    console.log(`Received ICE candidate from user ${socket.id}`);
    io.emit("adminIceCandidate", { id: socket.id, candidate: data });
  });

  socket.on("offer", (data) => {
    console.log(`Received offer from user ${socket.id}`);
    io.emit("adminOffer", { id: socket.id, offer: data });
  });

  socket.on("answer", (data) => {
    console.log(`Received answer from user ${socket.id}`);
    io.emit("adminAnswer", { id: socket.id, answer: data });
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
    connectedUsers = connectedUsers.filter((id) => id !== socket.id);
    updateConnectedUsers();

    // Clean up peer connection for the disconnected user
    if (peerConnections[socket.id]) {
      peerConnections[socket.id].close();
      delete peerConnections[socket.id];
    }
  });
});

server.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});
