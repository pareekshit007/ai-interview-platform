const model = require("../config/gemini");

const generateAnswerFeedback = async (question, transcript, scores) => {
  if (!transcript || transcript.trim().length < 10)
    return "No answer was provided. Try to speak clearly and cover key points.";

  try {
    const prompt = `You are an expert technical interviewer. Evaluate this interview answer concisely.

Question: "${question}"
Candidate's Answer: "${transcript}"
Metrics — Confidence: ${scores.confidence}/100, Clarity: ${scores.clarity}/100, Score: ${scores.score}/100

Provide feedback in exactly this format (2-3 sentences each):
STRENGTHS: <what the candidate did well>
IMPROVEMENTS: <specific things to improve>
TIP: <one actionable tip for next time>`;

    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (error) {
    console.error("⚠️  Answer feedback failed:", error.message);
    const level = scores.score >= 70 ? "good" : scores.score >= 50 ? "adequate" : "needs improvement";
    return `STRENGTHS: Your answer showed ${level} understanding.\nIMPROVEMENTS: Add concrete examples.\nTIP: Use the STAR method — Situation, Task, Action, Result.`;
  }
};

const generateSessionFeedback = async (role, answers, totalScore) => {
  try {
    const answerSummary = answers
      .map((a, i) => `Q${i + 1}: "${a.questionText}"\nAnswer: "${a.transcript?.substring(0, 200) || "No answer"}"\nScore: ${a.score}/100`)
      .join("\n\n");

    const prompt = `You are a senior technical interviewer providing a post-interview debrief.

Role: ${role} developer
Overall Score: ${totalScore}/100

Interview Summary:
${answerSummary}

Write a professional, encouraging debrief in this exact format:

OVERALL ASSESSMENT:
<2-3 sentences on overall performance>

TOP STRENGTHS:
- <strength 1>
- <strength 2>
- <strength 3>

KEY AREAS TO IMPROVE:
- <area 1 with specific advice>
- <area 2 with specific advice>

STUDY RECOMMENDATIONS:
- <topic or resource 1>
- <topic or resource 2>
- <topic or resource 3>

FINAL VERDICT: ${totalScore >= 85 ? "Excellent" : totalScore >= 70 ? "Good" : totalScore >= 50 ? "Average" : "Needs Work"}
<one motivating closing sentence>`;

    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (error) {
    console.error("⚠️  Session feedback failed:", error.message);
    const verdict = totalScore >= 85 ? "Excellent" : totalScore >= 70 ? "Good" : totalScore >= 50 ? "Average" : "Needs Work";
    return `OVERALL ASSESSMENT:\nYou scored ${totalScore}/100 in this ${role} interview. ${verdict} performance.\n\nTOP STRENGTHS:\n• Completed the full session\n• Demonstrated communication\n• Engaged with all questions\n\nKEY AREAS TO IMPROVE:\n• Add more technical depth\n• Use concrete examples\n\nSTUDY RECOMMENDATIONS:\n• Review core ${role} concepts\n• Practice mock interviews\n• Study system design\n\nFINAL VERDICT: ${verdict}\nKeep practicing — consistency is the key!`;
  }
};

module.exports = { generateAnswerFeedback, generateSessionFeedback };