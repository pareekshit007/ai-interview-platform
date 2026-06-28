/**
 * Migration: Recalculate totalScore + verdict for all completed interviews
 * whose totalScore is 0 but have answers with non-zero scores.
 *
 * Run once from server/ directory:
 *   node scripts/fixScores.js
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
  aiFeedback:    String,
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
    aiFeedback: String,
    completed:  Boolean,
  },
  { timestamps: true }
);

const Interview = mongoose.model("Interview", interviewSchema);

const getVerdict = (score) => {
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 50) return "Average";
  return "Needs Work";
};

async function fixScores() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ Connected to MongoDB");

  // Fetch ALL completed interviews
  const interviews = await Interview.find({ completed: true });
  console.log(`📋 Found ${interviews.length} completed interview(s) to check`);

  let fixed = 0;
  let skipped = 0;
  let alreadyCorrect = 0;

  for (const iv of interviews) {
    if (!iv.answers || iv.answers.length === 0) {
      skipped++;
      continue;
    }

    const correctScore = Math.round(
      iv.answers.reduce((sum, a) => sum + (a.score || 0), 0) / iv.answers.length
    );
    const correctVerdict = getVerdict(correctScore);

    if (iv.totalScore === correctScore) {
      alreadyCorrect++;
      continue;
    }

    // Use updateOne with $set to bypass the pre-save hook (which would recalculate anyway)
    await Interview.updateOne(
      { _id: iv._id },
      { $set: { totalScore: correctScore, verdict: correctVerdict } }
    );

    console.log(
      `  ✏️  Interview ${iv._id} (${iv.role}) — was ${iv.totalScore} → now ${correctScore} (${correctVerdict})`
    );
    fixed++;
  }

  console.log("\n─────────────────────────────────────────");
  console.log(`✅ Fixed:           ${fixed}`);
  console.log(`⏭️  Already correct: ${alreadyCorrect}`);
  console.log(`⚠️  Skipped (no answers): ${skipped}`);
  console.log("─────────────────────────────────────────");

  await mongoose.disconnect();
  console.log("🔌 Disconnected. Done.");
}

fixScores().catch((err) => {
  console.error("❌ Migration failed:", err.message);
  process.exit(1);
});