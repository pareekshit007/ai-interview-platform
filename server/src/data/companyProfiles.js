// Company-specific interview style profiles.
// These describe *publicly known, generally reported* interview patterns and
// emphases — used to bias the AI prompt toward a company's typical interview
// style. Not affiliated with or endorsed by any company listed.

const COMPANY_PROFILES = {
  google: {
    name: "Google",
    emoji: "🔍",
    style:
      "Google interviews emphasize algorithmic problem-solving, clean and optimal code, " +
      "clarifying questions before diving in, and explaining time/space complexity trade-offs. " +
      "For non-coding roles, focus on structured thinking (e.g. Googleyness, leadership without authority) " +
      "and data-driven decision making.",
    focusAreas: ["Algorithmic thinking", "Code optimization", "Structured problem solving", "Scalability"],
  },
  amazon: {
    name: "Amazon",
    emoji: "📦",
    style:
      "Amazon interviews are heavily built around the 16 Leadership Principles (Customer Obsession, " +
      "Ownership, Bias for Action, Dive Deep, etc.). Expect behavioral questions framed as 'Tell me about a time...' " +
      "requiring STAR-format answers, alongside practical technical/system design questions focused on scale and cost-efficiency.",
    focusAreas: ["Leadership Principles (STAR format)", "Ownership & customer obsession", "System design at scale", "Operational excellence"],
  },
  microsoft: {
    name: "Microsoft",
    emoji: "🪟",
    style:
      "Microsoft interviews balance technical depth with collaboration and growth-mindset questions. " +
      "Expect practical coding problems, questions about handling ambiguity, cross-team collaboration scenarios, " +
      "and a focus on how you learn from failure and adapt.",
    focusAreas: ["Growth mindset", "Collaboration scenarios", "Practical coding", "Handling ambiguity"],
  },
  meta: {
    name: "Meta",
    emoji: "♾️",
    style:
      "Meta (Facebook) interviews emphasize moving fast, impact-driven engineering, and product sense. " +
      "Expect coding questions under time pressure, system design questions about social-scale products " +
      "(feeds, notifications, messaging), and behavioral questions about driving impact and disagreeing/committing.",
    focusAreas: ["Product sense", "Social-scale system design", "Speed & impact", "Disagree and commit"],
  },
  netflix: {
    name: "Netflix",
    emoji: "🎬",
    style:
      "Netflix interviews focus heavily on the 'Freedom & Responsibility' culture — high autonomy, judgment, " +
      "and candid communication. Expect questions about making independent decisions, handling ambiguity without " +
      "process, and giving/receiving direct feedback, alongside strong technical fundamentals.",
    focusAreas: ["Judgment & autonomy", "Candid communication", "Technical excellence", "High performance culture"],
  },
  startup: {
    name: "Startup (Generic)",
    emoji: "🚀",
    style:
      "Startup interviews tend to be practical and fast-paced, testing versatility, hands-on problem-solving, " +
      "and comfort with ambiguity and limited resources. Expect questions about wearing multiple hats, " +
      "shipping fast, and pragmatic trade-offs over perfect architecture.",
    focusAreas: ["Versatility", "Pragmatic trade-offs", "Fast execution", "Resourcefulness"],
  },
};

const getCompanyProfile = (companyKey) => COMPANY_PROFILES[companyKey] || null;

const listCompanies = () =>
  Object.entries(COMPANY_PROFILES).map(([key, v]) => ({
    key, name: v.name, emoji: v.emoji, focusAreas: v.focusAreas,
  }));

module.exports = { COMPANY_PROFILES, getCompanyProfile, listCompanies };