const { Server } = require("socket.io");
const FriendInterviewRoom = require("../models/FriendInterviewRoom");

const roomSockets = new Map(); // code -> { host: socketId, guest: socketId }
// Persistent interview state per room so late-joiners/reconnectors get current state
const roomState   = new Map(); // code -> { started, ended, questionIndex, notes: {} }

const getState = (code) => roomState.get(code) || { started: false, ended: false, questionIndex: 0, notes: {} };

const initSignalingServer = (httpServer, allowedOrigins) => {
  const io = new Server(httpServer, {
    cors: { origin: allowedOrigins, credentials: true },
    path: "/socket.io",
  });

  io.on("connection", (socket) => {
    let joinedRoom = null;
    let joinedAs   = null;

    // ── Join room ──
    socket.on("room:join", async ({ code, as, name }) => {
      try {
        const room = await FriendInterviewRoom.findOne({ code: code?.toUpperCase() });
        if (!room) return socket.emit("room:error", { message: "Room not found or has expired" });
        if (room.status === "completed") return socket.emit("room:error", { message: "This interview has already ended" });

        const existing = roomSockets.get(room.code) || {};
        if (as === "guest" && existing.guest && existing.guest !== socket.id) {
          return socket.emit("room:error", { message: "Room is already full" });
        }

        existing[as] = socket.id;
        roomSockets.set(room.code, existing);
        socket.join(room.code);
        joinedRoom = room.code;
        joinedAs   = as;

        if (as === "guest" && name) {
          room.guestName = name;
          await room.save();
        }

        // Send current interview state so reconnectors/late-joiners are in sync
        const state = getState(room.code);

        socket.to(room.code).emit("peer:joined", { as, name });
        socket.emit("room:joined", {
          as,
          role:              room.role,
          difficulty:        room.difficulty,
          company:           room.company,
          questions:         room.questions,
          hostIsInterviewer: room.hostIsInterviewer,
          peerPresent:       as === "host" ? !!existing.guest : !!existing.host,
          // Current interview state — crucial for reconnects
          interviewStarted:  state.started,
          interviewEnded:    state.ended,
          questionIndex:     state.questionIndex,
          notes:             state.notes,
        });
      } catch (err) {
        socket.emit("room:error", { message: "Failed to join room" });
      }
    });

    // ── WebRTC signaling ──
    socket.on("webrtc:offer",         (p) => socket.to(joinedRoom).emit("webrtc:offer", p));
    socket.on("webrtc:answer",        (p) => socket.to(joinedRoom).emit("webrtc:answer", p));
    socket.on("webrtc:ice-candidate", (p) => socket.to(joinedRoom).emit("webrtc:ice-candidate", p));

    // ── Interview state (persisted in memory so reconnects work) ──
    socket.on("interview:start", () => {
      const state = getState(joinedRoom);
      state.started = true;
      roomState.set(joinedRoom, state);
      socket.to(joinedRoom).emit("interview:start");
    });

    socket.on("interview:next-question", ({ index }) => {
      const state = getState(joinedRoom);
      state.questionIndex = index;
      roomState.set(joinedRoom, state);
      socket.to(joinedRoom).emit("interview:next-question", { index });
    });

    socket.on("interview:note", ({ index, notes, rating }) => {
      const state = getState(joinedRoom);
      state.notes[index] = { notes, rating };
      roomState.set(joinedRoom, state);
      socket.to(joinedRoom).emit("interview:note", { index, notes, rating });
    });

    socket.on("interview:end", () => {
      const state = getState(joinedRoom);
      state.ended = true;
      roomState.set(joinedRoom, state);
      socket.to(joinedRoom).emit("interview:end");
    });

    socket.on("interview:scorecard", (data) => {
      socket.to(joinedRoom).emit("interview:scorecard", data);
    });

    // ── Chat ──
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
        if (!existing.host && !existing.guest) {
          roomSockets.delete(joinedRoom);
          roomState.delete(joinedRoom); // clean up state when room is empty
        } else {
          roomSockets.set(joinedRoom, existing);
        }
      }
      socket.to(joinedRoom).emit("peer:left", { as: joinedAs });
    });
  });

  return io;
};

module.exports = { initSignalingServer };