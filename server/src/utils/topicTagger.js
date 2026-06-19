// Lightweight keyword-based topic tagger.
// Maps a question's text to a human-readable topic bucket so we can
// aggregate weak-topic analytics without an extra AI call per question.

const TOPIC_RULES = [
  { topic: "React & Hooks",        keywords: ["react", "hook", "usestate", "useeffect", "jsx", "virtual dom", "component"] },
  { topic: "JavaScript Core",      keywords: ["javascript", "closure", "promise", "async", "var", "let", "const", "event loop", "this keyword"] },
  { topic: "CSS & Styling",        keywords: ["css", "flexbox", "grid", "box model", "specificity", "responsive"] },
  { topic: "System Design",        keywords: ["scal", "design a", "architecture", "load balanc", "microservice", "url shortener", "distributed"] },
  { topic: "Databases & SQL",      keywords: ["sql", "database", "index", "join", "query", "normalization", "acid", "transaction", "nosql"] },
  { topic: "APIs & Backend",       keywords: ["api", "rest", "endpoint", "middleware", "express", "node.js", "server"] },
  { topic: "Authentication & Security", keywords: ["auth", "jwt", "token", "encrypt", "password", "owasp", "xss", "injection", "https", "firewall"] },
  { topic: "Data Structures",      keywords: ["array", "linked list", "stack", "queue", "tree", "graph", "hash", "heap", "trie"] },
  { topic: "Algorithms",           keywords: ["algorithm", "sort", "search", "complexity", "dynamic programming", "recursion", "big o", "two-pointer", "sliding window"] },
  { topic: "Machine Learning",     keywords: ["model", "neural", "gradient", "overfit", "regression", "classification", "feature", "training data"] },
  { topic: "DevOps & Cloud",       keywords: ["docker", "kubernetes", "ci/cd", "deploy", "container", "pipeline", "terraform", "infrastructure"] },
  { topic: "Behavioral / HR",      keywords: ["tell me about", "strength", "weakness", "conflict", "leadership", "motivat", "feedback", "pressure"] },
  { topic: "Data Analysis",        keywords: ["data", "etl", "outlier", "olap", "oltp", "dataset"] },
];

const tagTopic = (questionText = "") => {
  const text = questionText.toLowerCase();
  for (const rule of TOPIC_RULES) {
    if (rule.keywords.some((kw) => text.includes(kw))) {
      return rule.topic;
    }
  }
  return "General";
};

module.exports = { tagTopic };