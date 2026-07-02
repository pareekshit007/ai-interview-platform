const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// gemini-1.5-flash and gemini-2.0-flash have both been shut down by Google
// (1.5 series retired entirely; 2.0 Flash retired June 1, 2026).
// gemini-2.5-flash is the current stable, well-rounded model as of mid-2026.
const MODEL_NAME = "gemini-2.5-flash";

// Shim to keep the same interface (`model.generateContent(prompt)` ->
// `result.response.text()`) that the rest of the app already relies on,
// so feedbackGenerator.js, questionGenerator.js, emailReminderService.js,
// and scoreAnswers.js don't need to change.
const model = {
  generateContent: async (prompt) => {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });
    return {
      response: {
        text: () => response.text,
      },
    };
  },
};

module.exports = model;