const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:3001"],
    methods: ["GET", "POST"],
  },
});

const connectedUsers = {};

io.on("connection", (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  socket.on("userConnect", (userData) => {
    console.log(`User connected: ${userData.userId}`);
    connectedUsers[socket.id] = { ...userData, socketId: socket.id };
    io.emit("userConnected", userData);
    socket.broadcast.emit("userConnected", userData);
  });

  socket.on("userDisconnect", (userId) => {
    console.log(`User disconnected: ${userId}`);
    const userData = connectedUsers[socket.id];
    if (userData) {
      delete connectedUsers[socket.id];
      io.emit("userDisconnected", userData?.userId);
      socket.broadcast.emit("userDisconnected", userData?.userId);
    }
  });

  socket.on("sdp", (data) => {
    console.log(`SDP received from ${socket.id} to ${data.userId}`);
    const targetSocket = connectedUsers[data.userId];
    if (targetSocket) {
      io.to(targetSocket.socketId).emit("sdp", {
        sdp: data.sdp,
        userId: socket.id,
      });
    } else {
      console.log(`User not found for SDP: ${data.userId}`);
    }
  });

  socket.on("iceCandidate", (data) => {
    console.log(`ICE Candidate received from ${socket.id} to ${data.userId}`);
    const targetSocket = connectedUsers[data.userId];
    if (targetSocket) {
      io.to(targetSocket.socketId).emit("iceCandidate", {
        candidate: data.candidate,
        userId: socket.id,
      });
    } else {
      console.log(`User not found for ICE Candidate: ${data.userId}`);
    }
  });

  socket.on("disconnect", () => {
    console.log(`Socket disconnected: ${socket.id}`);
    const userData = connectedUsers[socket.id];
    if (userData) {
      delete connectedUsers[socket.id];
      io.emit("userDisconnected", userData?.userId);
      socket.broadcast.emit("userDisconnected", userData?.userId);
    }
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
