const { customAlphabet } = require("nanoid");
const FriendInterviewRoom = require("../models/FriendInterviewRoom");
const Interview = require("../models/Interview");
const User = require("../models/User");
const { generateQuestions } = require("../services/questionGenerator");

const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const generateRoomCode = customAlphabet(CODE_ALPHABET, 6);

// ── Create room (host only, must be logged in) ──
const createRoom = async (req, res) => {
  try {
    const { role = "frontend", difficulty = "medium", company = null, hostIsInterviewer = true } = req.body;
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
      role, difficulty, company, questions,
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
      joinUrl: `${process.env.CLIENT_URL?.split(",")[0] || ""}/friend-interview/join/${room.code}`,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── Get room by code — public, used by join page ──
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

// ── Helper: update streak for a user ──
const updateStreak = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) return;
    const today = new Date().toDateString();
    const lastKey = user.lastInterviewDate ? new Date(user.lastInterviewDate).toDateString() : null;
    if (lastKey !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      user.currentStreak = lastKey === yesterday.toDateString() ? (user.currentStreak || 0) + 1 : 1;
      user.longestStreak = Math.max(user.longestStreak || 0, user.currentStreak);
      user.lastInterviewDate = new Date();
      await user.save();
    }
  } catch { /* non-critical */ }
};

// ── Finish room — saves history for both users ──
// Uses optionalAuth so both logged-in users can call it
const finishRoom = async (req, res) => {
  try {
    const room = await FriendInterviewRoom.findOne({ code: req.params.code.toUpperCase() });
    if (!room) return res.status(404).json({ message: "Room not found" });
    if (room.status === "completed") {
      // Already finished — return stored scorecard data
      return res.json({
        message: "Already completed",
        candidateScore: room.candidateScore,
        candidateVerdict: room.candidateVerdict,
        hostInterviewId: room.hostInterviewId,
        guestInterviewId: room.guestInterviewId,
      });
    }

    const { candidateAnswers = [], guestUserId = null } = req.body;

    // ── Compute score from star ratings (1-5 → 0-100) ──
    const rated = candidateAnswers.filter(a => a.rating > 0);
    const avgRating = rated.length
      ? rated.reduce((s, a) => s + a.rating, 0) / rated.length
      : 2.5; // default middle if no ratings
    const candidateScore = Math.round((avgRating / 5) * 100);
    const candidateVerdict =
      candidateScore >= 85 ? "Excellent" :
      candidateScore >= 70 ? "Good" :
      candidateScore >= 50 ? "Average" : "Needs Work";

    // Build answer objects for the Interview document
    const answers = candidateAnswers.map((a, i) => ({
      questionIndex: i,
      questionText: a.questionText || room.questions[i] || "",
      transcript: a.notes || "",
      score: a.rating ? Math.round((a.rating / 5) * 100) : 0,
      confidence: a.rating ? Math.round((a.rating / 5) * 100) : 0,
      clarity: a.rating ? Math.round((a.rating / 5) * 100) : 0,
      sentiment: a.rating ? Math.round((a.rating / 5) * 100) : 0,
      aiFeedback: a.notes || "",
      topic: "General",
    }));

    const interviewBase = {
      role: room.role,
      difficulty: room.difficulty,
      company: room.company,
      questions: room.questions,
      answers,
      totalScore: candidateScore,
      verdict: candidateVerdict,
      aiFeedback: `Friend interview session. Interviewer notes recorded per question. Overall rating: ${candidateVerdict} (${candidateScore}/100).`,
      completed: true,
    };

    // ── Create Interview doc for host ──
    let hostInterviewId = null;
    const hostInterview = await Interview.create({ ...interviewBase, user: room.host });
    hostInterviewId = hostInterview._id;
    await updateStreak(room.host);

    // ── Create Interview doc for guest if they're a registered user ──
    let guestInterviewId = null;
    const guestId = room.guest || guestUserId;
    if (guestId) {
      const guestInterview = await Interview.create({ ...interviewBase, user: guestId });
      guestInterviewId = guestInterview._id;
      await updateStreak(guestId);
    }

    // ── Save final state on room ──
    room.status = "completed";
    room.candidateAnswers = candidateAnswers;
    room.candidateScore = candidateScore;
    room.candidateVerdict = candidateVerdict;
    room.hostInterviewId = hostInterviewId;
    room.guestInterviewId = guestInterviewId;
    if (guestId && !room.guest) room.guest = guestId;
    await room.save();

    res.json({
      message: "Interview completed",
      candidateScore,
      candidateVerdict,
      hostInterviewId,
      guestInterviewId,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── Register guest user to room ──
const joinRoomAsUser = async (req, res) => {
  try {
    const room = await FriendInterviewRoom.findOne({ code: req.params.code.toUpperCase() });
    if (!room) return res.status(404).json({ message: "Room not found" });
    if (!room.guest) {
      room.guest = req.user._id;
      room.guestName = req.user.name || "Guest";
      room.status = "active";
      await room.save();
    }
    res.json({ message: "Joined", guestName: room.guestName });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createRoom, getRoomByCode, finishRoom, joinRoomAsUser };