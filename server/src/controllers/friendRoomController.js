const { customAlphabet } = require("nanoid");
const FriendInterviewRoom = require("../models/FriendInterviewRoom");
const { generateQuestions } = require("../services/questionGenerator");

// Room codes: 6 chars, uppercase, no ambiguous chars (0/O, 1/I/L)
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const generateRoomCode = customAlphabet(CODE_ALPHABET, 6);

const createRoom = async (req, res) => {
  try {
    const { role = "frontend", difficulty = "medium", company = null, hostIsInterviewer = true } = req.body;

    // Generate questions up front so both participants see the same set
    const questions = await generateQuestions(role, difficulty, 5, { company });

    let code, exists = true, attempts = 0;
    do {
      code = generateRoomCode();
      exists = await FriendInterviewRoom.exists({ code });
      attempts++;
    } while (exists && attempts < 5);

    const room = await FriendInterviewRoom.create({
      code,
      host: req.user._id,
      hostName: req.user.name || "Host",
      role,
      difficulty,
      company,
      questions,
      hostIsInterviewer,
      status: "waiting",
    });

    res.status(201).json({
      code: room.code,
      roomId: room._id,
      role: room.role,
      difficulty: room.difficulty,
      company: room.company,
      hostIsInterviewer: room.hostIsInterviewer,
      joinUrl: `${process.env.CLIENT_URL || ""}/friend-interview/join/${room.code}`,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Public lookup — guests need this before they've joined/authenticated
const getRoomByCode = async (req, res) => {
  try {
    const room = await FriendInterviewRoom.findOne({ code: req.params.code.toUpperCase() });
    if (!room) return res.status(404).json({ message: "Room not found or has expired" });
    if (room.status === "completed") return res.status(410).json({ message: "This interview has already ended" });

    res.json({
      code: room.code,
      hostName: room.hostName,
      guestName: room.guestName,
      role: room.role,
      difficulty: room.difficulty,
      company: room.company,
      status: room.status,
      hostIsInterviewer: room.hostIsInterviewer,
      questionCount: room.questions.length,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const finishRoom = async (req, res) => {
  try {
    const room = await FriendInterviewRoom.findOne({ code: req.params.code.toUpperCase() });
    if (!room) return res.status(404).json({ message: "Room not found" });

    room.status = "completed";
    if (Array.isArray(req.body.candidateAnswers)) {
      room.candidateAnswers = req.body.candidateAnswers;
    }
    await room.save();

    res.json({ message: "Interview marked complete", room });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createRoom, getRoomByCode, finishRoom };