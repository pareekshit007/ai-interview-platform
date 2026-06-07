const mongoose = require("mongoose");

const answerSchema = new mongoose.Schema({
  questionIndex: { type: Number, required: true },
  questionText:  { type: String, required: true },
  transcript:    { type: String, default: "" },
  score:         { type: Number, default: 0 },
  confidence:    { type: Number, default: 0 },
  clarity:       { type: Number, default: 0 },
  sentiment:     { type: Number, default: 0 },
  aiFeedback:    { type: String, default: "" },
});

const interviewSchema = new mongoose.Schema(
  {
    user:       { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    role:       { type: String, required: true },
    difficulty: { type: String, default: "medium" },
    questions:  [{ type: String }],
    answers:    [answerSchema],
    totalScore: { type: Number, default: 0 },
    verdict:    { type: String, default: "" },
    aiFeedback: { type: String, default: "" },
    completed:  { type: Boolean, default: false },
  },
  { timestamps: true }
);

interviewSchema.pre("save", function (next) {
  if (this.answers && this.answers.length > 0) {
    const sum = this.answers.reduce((acc, a) => acc + (a.score || 0), 0);
    this.totalScore = Math.round(sum / this.answers.length);
    if (this.totalScore >= 85)      this.verdict = "Excellent";
    else if (this.totalScore >= 70) this.verdict = "Good";
    else if (this.totalScore >= 50) this.verdict = "Average";
    else                            this.verdict = "Needs Work";
  }
  next();
});

module.exports = mongoose.model("Interview", interviewSchema);