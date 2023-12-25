const express = require("express");
const http = require("http");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:3001"],
    methods: ["GET", "POST"],
  },
});

const activeUsers = {};

io.on("connection", (socket) => {
  const userId = socket.id;
  activeUsers[userId] = socket.id;

  socket.on("user_connected", () => {
    socket.broadcast.emit("user_connected", userId);
    console.log("user connected");
  });

  socket.on("send-offer-to-admin", (offer) => {
    socket.broadcast.emit("offer-from-user", offer, userId);
    console.log("offer sent");
  });

  socket.on("send-answer-to-user", (answer, userId) => {
    socket.to(userId).emit("answer-from-admin", answer);
    console.log("answer sent");
  });

  socket.on("send-ice-candidate-to-admin", (candidate) => {
    socket.broadcast.emit("ice-candidate-from-user", candidate, userId);
    console.log("ice candidate sent");
  });

  socket.on("send-ice-candidate-to-user", (candidate, userId) => {
    socket.to(userId).emit("ice-candidate-from-admin", candidate);
    console.log("ice candidate sent");
  });

  socket.on("disconnect", () => {
    delete activeUsers[userId];
    socket.broadcast.emit("user_disconnected", userId);
  });
});

server.listen(5000, () => {
  console.log("Server listening on port 5000");
});
