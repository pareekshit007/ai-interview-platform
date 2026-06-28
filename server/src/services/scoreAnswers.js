/**
 * AI-powered answer scorer using Gemini.
 * Called during submitInterview to score each answer with a real score (0-100).
 * Falls back to the client-sent score if AI scoring fails.
 */
const model = require("../config/gemini");

const scoreAnswer = async (question, transcript, clientScore) => {
  // If no transcript, nothing to score
  if (!transcript || transcript.trim().length < 5) return clientScore || 0;

  try {
    const prompt = `You are a strict but fair technical interviewer. Score this interview answer from 0 to 100.

Question: "${question}"
Candidate's Answer: "${transcript.substring(0, 800)}"

Scoring rubric:
- 85-100: Excellent — accurate, detailed, uses correct terminology, gives examples
- 70-84:  Good — mostly correct, some depth, minor gaps
- 50-69:  Average — partially correct, lacks depth or examples
- 25-49:  Weak — vague, incomplete, or partially wrong
- 0-24:   Poor — wrong, off-topic, or no meaningful content

Reply with ONLY a single integer number between 0 and 100. No explanation, no text, just the number.`;

    const result = await model.generateContent(prompt);
    const text   = result.response.text().trim();
    const score  = parseInt(text, 10);

    if (!isNaN(score) && score >= 0 && score <= 100) return score;
    return clientScore || 0;
  } catch (err) {
    console.error("⚠️  AI scoring failed for one answer:", err.message);
    return clientScore || 0;
  }
};

/**
 * Score all answers in parallel (with a concurrency cap to avoid rate limits).
 */
const scoreAllAnswers = async (answers) => {
  // Score up to 3 at a time
  const results = [];
  for (let i = 0; i < answers.length; i += 3) {
    const batch = answers.slice(i, i + 3);
    const batchScores = await Promise.all(
      batch.map((a) => scoreAnswer(a.questionText, a.transcript, a.score))
    );
    results.push(...batchScores);
  }
  return results;
};

module.exports = { scoreAllAnswers };