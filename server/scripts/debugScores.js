/**
 * Debug: Print the last 5 completed interviews with their answer scores
 * Run: node scripts/debugScores.js
 */

require("dotenv").config();
const mongoose = require("mongoose");

const answerSchema = new mongoose.Schema({
  questionIndex: Number,
  questionText:  String,
  transcript:    String,
  score:         { type: Number, default: 0 },
  confidence:    { type: Number, default: 0 },
  clarity:       { type: Number, default: 0 },
  sentiment:     { type: Number, default: 0 },
  topic:         String,
});

const interviewSchema = new mongoose.Schema(
  {
    user:       mongoose.Schema.Types.ObjectId,
    role:       String,
    difficulty: String,
    questions:  [String],
    answers:    [answerSchema],
    totalScore: { type: Number, default: 0 },
    verdict:    String,
    completed:  Boolean,
  },
  { timestamps: true }
);

const Interview = mongoose.model("Interview", interviewSchema);

async function debug() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ Connected\n");

  const interviews = await Interview.find({ completed: true })
    .sort({ createdAt: -1 })
    .limit(5);

  for (const iv of interviews) {
    console.log(`\n📋 Interview: ${iv._id}`);
    console.log(`   Role: ${iv.role} | totalScore in DB: ${iv.totalScore}`);
    console.log(`   Answers (${iv.answers.length}):`);
    iv.answers.forEach((a, i) => {
      console.log(`     Q${i+1}: score=${a.score} | confidence=${a.confidence} | transcript="${(a.transcript||"").substring(0,60)}"`);
    });
  }

  await mongoose.disconnect();
}

debug().catch(console.error);