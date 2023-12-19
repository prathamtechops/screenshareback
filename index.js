const express = require("express");
const http = require("http");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
  },
});

const rooms = {};
const ROOM_ID = "constantRoomId"; // Replace 'constantRoomId' with your actual constant room ID

io.on("connection", (socket) => {
  console.log("User connected: ", socket.id);

  socket.on("offer", (data) => {
    console.log("offer event received: ", data);
    const targetSocketId = rooms[ROOM_ID] && rooms[ROOM_ID].admin;
    if (targetSocketId) {
      io.to(targetSocketId).emit("offer", data);
    } else {
      console.log("Admin not found for room: ", ROOM_ID);
    }
  });

  socket.on("answer", (data) => {
    console.log("answer event received: ", data);
    socket.to(ROOM_ID).emit("answer", data);
  });

  socket.on("ice-candidate", (data) => {
    console.log("ice-candidate event received: ", data);
    socket.to(ROOM_ID).emit("ice-candidate", data);
    console.log("Emitted ice-candidate event");
  });

  socket.on("join-room", () => {
    console.log("join-room event received: ", ROOM_ID);
    socket.join(ROOM_ID);
    console.log("Joined room: ", ROOM_ID);
    if (!rooms[ROOM_ID]) {
      rooms[ROOM_ID] = { admin: socket.id, user: null };
      console.log("Created new room: ", ROOM_ID);
    } else {
      rooms[ROOM_ID].user = socket.id;
      console.log("User joined room: ", ROOM_ID);
      io.to(rooms[ROOM_ID].admin).emit("user-connected", socket.id);
      console.log("Emitted user-connected event");
    }
  });

  socket.on("disconnect", () => {
    console.log("user disconnected: ", socket.id);
    if (rooms[ROOM_ID]) {
      // Check if the room exists
      console.log("Room exists: ", ROOM_ID);
      if (rooms[ROOM_ID].admin === socket.id) {
        delete rooms[ROOM_ID];
        console.log("Admin disconnected, deleted room: ", ROOM_ID);
      } else if (rooms[ROOM_ID].user === socket.id) {
        rooms[ROOM_ID].user = null;
        console.log("User disconnected, room still exists: ", ROOM_ID);
      }
    }
  });
});

server.listen(5000, () => {
  console.log("Server listening on port 5000");
});
