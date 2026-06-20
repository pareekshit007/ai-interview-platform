const { Server } = require("socket.io");
const FriendInterviewRoom = require("../models/FriendInterviewRoom");

// In-memory map of which socket belongs to which room/role.
// This is presence/signaling state only — never video/audio data, which
// flows peer-to-peer directly between browsers once WebRTC negotiation completes.
const roomSockets = new Map(); // roomCode -> { host: socketId, guest: socketId }

const initSignalingServer = (httpServer, allowedOrigins) => {
  const io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
    },
    path: "/socket.io",
  });

  io.on("connection", (socket) => {
    let joinedRoom = null;
    let joinedAs = null; // "host" | "guest"

    socket.on("room:join", async ({ code, as, name }) => {
      try {
        const room = await FriendInterviewRoom.findOne({ code: code?.toUpperCase() });
        if (!room) return socket.emit("room:error", { message: "Room not found or expired" });
        if (room.status === "completed") return socket.emit("room:error", { message: "This interview has already ended" });

        const existing = roomSockets.get(room.code) || {};

        // Prevent a third person from joining an already-full room
        if (as === "guest" && existing.guest && existing.guest !== socket.id) {
          return socket.emit("room:error", { message: "Room is already full" });
        }
        if (as === "host" && existing.host && existing.host !== socket.id) {
          // Host reconnecting (e.g. refresh) replaces the stale socket id
        }

        existing[as] = socket.id;
        roomSockets.set(room.code, existing);

        socket.join(room.code);
        joinedRoom = room.code;
        joinedAs = as;

        if (as === "guest" && name) {
          room.guestName = name;
          await room.save();
        }

        socket.to(room.code).emit("peer:joined", { as, name });
        socket.emit("room:joined", {
          as,
          role: room.role,
          difficulty: room.difficulty,
          company: room.company,
          questions: room.questions,
          hostIsInterviewer: room.hostIsInterviewer,
          peerPresent: as === "host" ? !!existing.guest : !!existing.host,
        });
      } catch (err) {
        socket.emit("room:error", { message: "Failed to join room" });
      }
    });

    // ── WebRTC signaling relay (offer / answer / ICE candidates) ──
    // The server never inspects or stores this payload — pure relay.
    socket.on("webrtc:offer",     (payload) => socket.to(joinedRoom).emit("webrtc:offer", payload));
    socket.on("webrtc:answer",    (payload) => socket.to(joinedRoom).emit("webrtc:answer", payload));
    socket.on("webrtc:ice-candidate", (payload) => socket.to(joinedRoom).emit("webrtc:ice-candidate", payload));

    // ── Interview sync: question navigation, live notes/ratings ──
    socket.on("interview:next-question", ({ index }) => {
      socket.to(joinedRoom).emit("interview:next-question", { index });
    });

    socket.on("interview:start", () => {
      socket.to(joinedRoom).emit("interview:start");
    });

    socket.on("interview:note", ({ index, notes, rating }) => {
      socket.to(joinedRoom).emit("interview:note", { index, notes, rating });
    });

    socket.on("interview:end", () => {
      socket.to(joinedRoom).emit("interview:end");
    });

    // ── Simple in-call chat (fallback if audio fails) ──
    socket.on("chat:message", ({ text, from }) => {
      socket.to(joinedRoom).emit("chat:message", { text, from, at: Date.now() });
    });

    socket.on("media:toggle", ({ kind, enabled }) => {
      socket.to(joinedRoom).emit("media:toggle", { kind, enabled, from: joinedAs });
    });

    socket.on("disconnect", () => {
      if (!joinedRoom) return;
      const existing = roomSockets.get(joinedRoom);
      if (existing) {
        if (existing[joinedAs] === socket.id) delete existing[joinedAs];
        if (!existing.host && !existing.guest) roomSockets.delete(joinedRoom);
        else roomSockets.set(joinedRoom, existing);
      }
      socket.to(joinedRoom).emit("peer:left", { as: joinedAs });
    });
  });

  return io;
};

module.exports = { initSignalingServer };