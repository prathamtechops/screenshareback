const express = require("express");
const http = require("http");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:3002",
    ],
    methods: ["GET", "POST"],
  },
});

const connectedPeers = new Map();

io.on("connection", (socket) => {
  console.log("Connected: " + socket.id);
  connectedPeers.set(socket.id, socket);

  socket.on("disconnect", () => {
    console.log("Disconnected: " + socket.id);
    connectedPeers.delete(socket.id);
  });

  socket.on("send-offer-to-admin", (offer, fromId) => {
    console.log("User: Sending offer to admin");
    setTimeout(() => {
      for (const [id, socketPeer] of connectedPeers.entries()) {
        if (id !== socket.id) {
          console.log("Server: Sending offer from user to admin");
          socketPeer.emit("offer-from-user", offer, fromId);
        }
      }
    }, 2000); // delay the emission of the offer-from-user event by 2 seconds
  });

  socket.on("send-answer-to-user", (answer, toId, fromId) => {
    console.log("Admin: Sending answer to user");
    const socketPeer = connectedPeers.get(toId);
    if (socketPeer) {
      console.log("Server: Sending answer from admin to user");
      socketPeer.emit("answer-from-admin", answer, fromId);
    } else {
      console.error("No peer found with ID:", toId);
    }
  });

  socket.on("send-ice-candidate-to-admin", (candidate, fromId) => {
    console.log("User: Sending ICE candidate to admin");
    for (const [id, socketPeer] of connectedPeers.entries()) {
      if (id !== socket.id) {
        console.log("Server: Sending ICE candidate from user to admin");
        socketPeer.emit("ice-candidate-from-user", candidate, fromId);
      }
    }
  });

  socket.on("send-ice-candidate-to-user", (candidate, toId, fromId) => {
    console.log("Admin: Sending ICE candidate to user");
    const socketPeer = connectedPeers.get(toId);
    if (socketPeer) {
      console.log("Server: Sending ICE candidate from admin to user");
      socketPeer.emit("ice-candidate-from-admin", candidate, fromId);
    } else {
      console.error("No peer found with ID:", toId);
    }
  });
});

const PORT = 5000;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
