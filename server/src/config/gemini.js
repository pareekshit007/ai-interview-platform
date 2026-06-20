const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// gemini-1.5-flash and gemini-2.0-flash have both been shut down by Google
// (1.5 series retired entirely; 2.0 Flash retired June 1, 2026).
// gemini-2.5-flash is the current stable, well-rounded model as of mid-2026.
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

module.exports = model;