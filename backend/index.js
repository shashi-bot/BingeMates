import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import mongoose from "mongoose";
import session from "express-session";
import passport from "passport";
import http from "http";
import { Server } from "socket.io";
import throttle from "lodash/throttle.js";

import "./config/passport.js"; // Google strategy
import authRoutes from "./routes/auth.js";
import roomRoutes from "./routes/room.js";

dotenv.config();

const app = express();
const server = http.createServer(app); // Use raw HTTP server
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_ORIGIN, // frontend URL
    credentials: true,
  },
});

//  Middleware
app.use(cors({ origin: process.env.CLIENT_ORIGIN, credentials: true }));
app.use(express.json());

// Session setup (needed for passport to work)
app.use(
  session({
    secret: process.env.SESSION_SECRET || "bingemates_secret", // Use env var
    resave: false,
    saveUninitialized: true,
  })
);

// Passport init
app.use(passport.initialize());
app.use(passport.session());

//  Routes
app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomRoutes);


// MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("MongoDB connected");
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => console.log(` Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err.message);
  });

// SOCKET.IO handlers
io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("join-room", (roomId) => {
    socket.join(roomId);
    console.log(`${socket.id} joined room ${roomId}`);
  });

  socket.on("chat-message", ({ roomId, sender, content }) => {
    const safeSender = sender || "Unknown";
    if (!content) return;
    io.to(roomId).emit("chat-message", { sender: safeSender, content });
  });

  socket.on("video-change", ({ roomId, videoId }) => {
    if (!videoId) return; // ignore undefined / empty ids
    io.to(roomId).emit("video-change", videoId);
  });




  const throttledSeek = throttle(({ roomId, time, sourceId }) => {
    io.to(roomId)
      .except(sourceId)          // <-- skip sender
      .emit("video-control", { action: "seek", time, sourceId });
  }, 500, { leading: true, trailing: false });
  
  socket.on("video-control", ({ roomId, action, time, sourceId }) => {
    if (action === "seek") {
      throttledSeek({ roomId, time, sourceId });
    } else {
      // play / pause: also skip sender
      io.to(roomId).except(sourceId).emit("video-control", { action, time, sourceId });
    }
  });
//   socket.on("participant-joined", ({ roomId, displayName }) => {
//     if (!displayName) return; //  ignore undefined / empty displayName
//     io.to(roomId).emit("participant-joined", { displayName });
//     console.log(`${displayName} joined room ${roomId}`);
//   });

//   socket.on("participant-left", ({ roomId, displayName }) => {
//     if (!displayName) return; // ignore undefined / empty displayName
//     io.to(roomId).emit("participant-left", { displayName });
//     console.log(` ${displayName} left room ${roomId}`);
//   });

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});