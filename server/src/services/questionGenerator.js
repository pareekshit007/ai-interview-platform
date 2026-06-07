const model = require("../config/gemini");

const FALLBACK_QUESTIONS = {
  frontend: [
    "Explain the difference between var, let, and const in JavaScript.",
    "What is the virtual DOM and how does React use it?",
    "Describe the CSS box model and how it affects layout.",
    "What are React hooks? Explain useState and useEffect with examples.",
    "How does browser rendering work from HTML to painted pixels?",
  ],
  backend: [
    "Explain REST API design principles and HTTP methods.",
    "What is JWT authentication and how does it work?",
    "Compare SQL and NoSQL databases — when do you use each?",
    "What is middleware in Express.js and how do you use it?",
    "Explain the event loop in Node.js.",
  ],
  fullstack: [
    "Walk me through how a full-stack web request flows end to end.",
    "How do you handle authentication across frontend and backend?",
    "Explain CORS and how to configure it properly.",
    "What is the difference between server-side and client-side rendering?",
    "How would you design a scalable REST API for a social media app?",
  ],
  devops: [
    "What is Docker and why do we use containers?",
    "Explain CI/CD and how you would set up a pipeline.",
    "What is Kubernetes and when would you use it over Docker Compose?",
    "How do you monitor a production application?",
    "Explain blue-green deployments.",
  ],
  datascience: [
    "Explain the difference between supervised and unsupervised learning.",
    "What is overfitting and how do you prevent it?",
    "Describe the steps in a typical machine learning pipeline.",
    "What is the bias-variance tradeoff?",
    "Explain cross-validation and why it is important.",
  ],
};

const generateQuestions = async (role = "frontend", difficulty = "medium", count = 5) => {
  try {
    const difficultyNote = {
      easy:   "entry-level candidates with 0-1 years experience",
      medium: "mid-level candidates with 2-3 years experience",
      hard:   "senior candidates with 4+ years experience",
    }[difficulty] || "mid-level candidates";

    const prompt = `Generate exactly ${count} technical interview questions for a ${role} developer role.
Target: ${difficultyNote}.
Difficulty: ${difficulty}.

Rules:
- Mix of technical knowledge, problem-solving, and behavioral questions
- Questions should be specific and actionable, not vague
- Each question on its own line, numbered 1 to ${count}
- Do NOT add any explanation or preamble, just the numbered questions

Format:
1. <question>
2. <question>`;

    const result = await model.generateContent(prompt);
    const raw = result.response.text();

    const lines = raw
      .split("\n")
      .map((l) => l.replace(/^\d+\.\s*/, "").trim())
      .filter((l) => l.length > 10);

    if (lines.length < 3) throw new Error("Insufficient questions returned");
    return lines.slice(0, count);
  } catch (error) {
    console.error("⚠️  Question generation failed, using fallback:", error.message);
    const fallback = FALLBACK_QUESTIONS[role] || FALLBACK_QUESTIONS.fullstack;
    return fallback.slice(0, count);
  }
};

module.exports = { generateQuestions };