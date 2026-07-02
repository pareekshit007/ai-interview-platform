const model = require("../config/gemini");
const { getCompanyProfile } = require("../data/companyProfiles");

// Large fallback pool — shuffled randomly so repeats are very unlikely
const FALLBACK_POOL = {
  frontend: [
    "Explain the difference between var, let, and const in JavaScript.",
    "What is the virtual DOM and how does React use it?",
    "Describe the CSS box model and how it affects layout.",
    "What are React hooks? Explain useState and useEffect with examples.",
    "How does browser rendering work from HTML to painted pixels?",
    "What is CSS specificity and how is it calculated?",
    "Explain event delegation and why it is useful.",
    "What is the difference between == and === in JavaScript?",
    "How do closures work in JavaScript? Give a practical example.",
    "What is lazy loading and how do you implement it in React?",
    "Explain the difference between controlled and uncontrolled components in React.",
    "What is memoization and when would you use React.memo or useMemo?",
    "How does the CSS flexbox model work? Compare it with CSS Grid.",
    "What is a Promise in JavaScript? How is it different from async/await?",
    "Explain the difference between localStorage, sessionStorage, and cookies.",
    "What is code splitting in React and why is it important for performance?",
    "How do you handle errors in React using error boundaries?",
    "What is CORS and how does it affect frontend development?",
    "Explain debouncing and throttling with examples.",
    "What are Web Vitals and how do you optimize them?",
    "What is the difference between a functional and a class component in React?",
    "Explain the CSS cascade and how specificity conflicts get resolved.",
    "What is tree shaking and how does it reduce bundle size?",
    "How does React's key prop affect list rendering performance?",
    "What is the difference between server-side rendering and static site generation?",
    "Explain how you would optimize images for a fast-loading website.",
    "What is a Web Worker and when would you use one?",
    "How do you handle accessibility (a11y) in a React application?",
    "What is the difference between em, rem, and px units in CSS?",
    "Explain how React's useContext hook works and when you'd avoid it.",
  ],
  backend: [
    "Explain REST API design principles and HTTP methods.",
    "What is JWT authentication and how does it work?",
    "Compare SQL and NoSQL databases — when do you use each?",
    "What is middleware in Express.js and how do you use it?",
    "Explain the event loop in Node.js.",
    "What is database indexing and why does it matter for performance?",
    "How would you implement rate limiting in an API?",
    "What is the difference between authentication and authorization?",
    "Explain database transactions and ACID properties.",
    "How do you handle file uploads securely in a Node.js API?",
    "What is connection pooling and why is it important?",
    "Explain the difference between horizontal and vertical scaling.",
    "How do you prevent SQL injection attacks?",
    "What is caching and when would you use Redis over in-memory caching?",
    "Explain how you would design a rate-limited REST API.",
    "What are environment variables and why should secrets never be hardcoded?",
    "How does bcrypt work and why is it used for password hashing?",
    "What is the N+1 query problem and how do you solve it?",
    "Explain microservices architecture and its tradeoffs vs monolith.",
    "How would you design a URL shortener backend?",
    "What is the difference between PUT and PATCH HTTP methods?",
    "Explain how you would design a job queue for background tasks.",
    "What is idempotency and why does it matter for API design?",
    "How does database replication work and what problems does it solve?",
    "Explain optimistic vs pessimistic locking in a database.",
    "What is a webhook and how does it differ from polling?",
    "How would you design a rate limiter using a sliding window algorithm?",
    "What is the difference between synchronous and asynchronous processing in Node.js?",
    "Explain how you would secure sensitive data at rest and in transit.",
    "What is GraphQL and how does it differ from REST?",
  ],
  fullstack: [
    "Walk me through how a full-stack web request flows end to end.",
    "How do you handle authentication across frontend and backend?",
    "Explain CORS and how to configure it properly.",
    "What is the difference between server-side and client-side rendering?",
    "How would you design a scalable REST API for a social media app?",
    "Explain the MERN stack and the role of each component.",
    "How do you handle state management in a large React application?",
    "What is the difference between SSR, SSG, and CSR? When do you use each?",
    "How do you deploy a full-stack MERN application?",
    "Explain JWT refresh tokens and how to implement token rotation.",
    "How do you handle real-time features like notifications in a MERN app?",
    "What is the difference between optimistic and pessimistic UI updates?",
    "How would you implement file upload from React to a Node.js backend?",
    "Explain how you would implement role-based access control end to end.",
    "What strategies do you use to keep frontend and backend in sync?",
    "How do you debug a production issue in a full-stack application?",
    "Explain how pagination works — offset vs cursor-based.",
    "How would you implement a search feature across a full-stack app?",
    "What is a monorepo and what are its advantages for full-stack development?",
    "How do you ensure your API is backward compatible as it evolves?",
    "How would you architect a notification system across email, push, and in-app?",
    "What is the difference between REST and WebSocket communication?",
    "How do you handle form validation consistently across frontend and backend?",
    "Explain how you would design a multi-tenant SaaS application.",
    "What is the role of environment-specific configuration in a full-stack deploy pipeline?",
    "How would you implement infinite scroll efficiently end to end?",
    "Explain how you'd structure a full-stack app for testability (unit, integration, e2e).",
    "How do you handle versioning of APIs consumed by multiple frontend clients?",
    "What is the difference between a monolithic and a microservices-based full-stack architecture?",
    "How would you implement a feature flag system across frontend and backend?",
  ],
  devops: [
    "What is Docker and why do we use containers?",
    "Explain CI/CD and how you would set up a pipeline.",
    "What is Kubernetes and when would you use it over Docker Compose?",
    "How do you monitor a production application?",
    "Explain blue-green deployments.",
    "What is infrastructure as code? Give an example with Terraform or Ansible.",
    "How do you manage secrets and environment variables in production?",
    "Explain the difference between a VM and a container.",
    "What is a reverse proxy and how does Nginx act as one?",
    "How would you set up auto-scaling for a Node.js application?",
    "What is a load balancer and what algorithms does it use?",
    "Explain how you would handle zero-downtime deployments.",
    "What is the ELK stack and how is it used for logging?",
    "How do you secure a cloud-based production environment?",
    "What is a container registry and how does it fit into a CI/CD pipeline?",
    "What is the difference between a rolling deployment and a canary deployment?",
    "How would you set up centralized logging for a multi-service system?",
    "Explain the difference between horizontal pod autoscaling and cluster autoscaling.",
    "What is GitOps and how does it differ from traditional CI/CD?",
    "How do you handle configuration drift across environments?",
    "What is a service mesh and what problems does it solve?",
    "Explain how health checks and readiness probes work in Kubernetes.",
    "How would you design a disaster recovery plan for a production system?",
  ],
  datascience: [
    "Explain the difference between supervised and unsupervised learning.",
    "What is overfitting and how do you prevent it?",
    "Describe the steps in a typical machine learning pipeline.",
    "What is the bias-variance tradeoff?",
    "Explain cross-validation and why it is important.",
    "What is the difference between precision and recall?",
    "Explain how a decision tree works.",
    "What is gradient descent and how does it optimize a model?",
    "Compare L1 and L2 regularization.",
    "What is feature engineering and why does it matter?",
    "Explain the difference between batch, mini-batch, and stochastic gradient descent.",
    "What is a confusion matrix and what metrics can you derive from it?",
    "How does a Random Forest differ from a single Decision Tree?",
    "What is the curse of dimensionality?",
    "Explain principal component analysis (PCA) in simple terms.",
    "What is the difference between bagging and boosting?",
    "Explain how a convolutional neural network processes an image.",
    "What is data leakage and how do you prevent it during model training?",
    "How would you handle a heavily imbalanced classification dataset?",
    "What is the difference between a generative and a discriminative model?",
    "Explain the ROC curve and what AUC tells you about a model.",
    "What is hyperparameter tuning and what methods can you use for it?",
  ],
  hr: [
    "Tell me about yourself and your background.",
    "What are your greatest strengths and weaknesses?",
    "Describe a challenging situation you faced and how you handled it.",
    "Where do you see yourself in 5 years?",
    "Why do you want to work at this company?",
    "Tell me about a time you worked in a team and there was a conflict.",
    "How do you handle pressure and tight deadlines?",
    "What motivates you in your work?",
    "Describe a time you showed leadership.",
    "How do you handle receiving critical feedback?",
    "Tell me about a time you had to learn something completely new quickly.",
    "How do you prioritize tasks when everything feels urgent?",
    "Describe a mistake you made at work and what you learned from it.",
    "Why should we hire you over other candidates?",
    "How do you stay updated with new trends in your field?",
    "Tell me about a time you disagreed with a manager's decision.",
    "What does success look like to you in this role?",
  ],
  dsa: [
    "Explain the time complexity of binary search and when you would use it.",
    "What is the difference between a stack and a queue? Give real-world examples.",
    "Explain how a hash table works and what causes collisions.",
    "What is dynamic programming? Explain with the Fibonacci example.",
    "Describe BFS vs DFS and when you would use each.",
    "What is a linked list and how does it differ from an array?",
    "Explain quicksort — how does it work and what is its average time complexity?",
    "What is memoization and how does it relate to dynamic programming?",
    "Explain a sliding window approach and when it is useful.",
    "What is a binary search tree and what are its properties?",
    "How does merge sort work? What is its time and space complexity?",
    "Explain two-pointer technique with an example problem.",
    "What is a trie and when would you use it over a hash map?",
    "Explain Dijkstra's algorithm and its use case.",
    "What is the difference between a min-heap and a max-heap?",
    "What is the time complexity of common operations on a hash map?",
    "Explain the difference between depth-first and breadth-first search on a graph.",
    "What is a greedy algorithm and when does it fail to find the optimal solution?",
    "How does the union-find (disjoint set) data structure work?",
    "Explain backtracking with an example like N-Queens or Sudoku.",
    "What is topological sorting and when is it used?",
    "How would you detect a cycle in a linked list?",
  ],
};

// Fisher-Yates shuffle
const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const generateQuestions = async (role = "frontend", difficulty = "medium", count = 5, options = {}) => {
  try {
    const { company = null, resumeContext = null } = options;

    const difficultyNote = {
      easy:   "entry-level candidates with 0–1 year of experience. Questions should test fundamentals and conceptual understanding.",
      medium: "mid-level candidates with 2–3 years of experience. Questions should test practical knowledge and problem-solving.",
      hard:   "senior candidates with 4+ years of experience. Questions should test deep understanding, architecture, and trade-offs.",
    }[difficulty] || "mid-level candidates";

    // Use timestamp + random seed in prompt to force Gemini to generate fresh questions each time
    const seed = Math.random().toString(36).slice(2, 8);
    const timestamp = Date.now();

    const companyProfile = company ? getCompanyProfile(company) : null;
    const companyBlock = companyProfile
      ? `\nCompany Style: Simulate a ${companyProfile.name} interview. ${companyProfile.style}\nWeight the questions toward these focus areas where relevant to the role: ${companyProfile.focusAreas.join(", ")}.\n`
      : "";

    const resumeBlock = resumeContext
      ? `\nCandidate Background (tailor 1-2 questions to this where relevant): ${String(resumeContext).slice(0, 800)}\n`
      : "";

    const prompt = `You are a senior technical interviewer${companyProfile ? ` at ${companyProfile.name}` : ""}. Generate exactly ${count} UNIQUE interview questions for a ${role} developer position.

Session ID: ${seed}-${timestamp} (use this to ensure questions are different every time)
Difficulty: ${difficulty.toUpperCase()} — targeted at ${difficultyNote}
${companyBlock}${resumeBlock}
Requirements:
- Every question must be DIFFERENT from common/repeated interview questions
- Mix types: ~60% deep technical, ~20% scenario/problem-solving, ~20% practical experience
- Questions must be specific, not generic. Bad: "Tell me about React". Good: "How does React's reconciliation algorithm decide which DOM nodes to update?"
- Difficulty level must match: ${difficulty}
- Role focus: ${role}

Output format — ONLY the numbered questions, nothing else:
1. <question>
2. <question>
3. <question>
4. <question>
5. <question>`;

    const result = await model.generateContent(prompt);
    const raw = result.response.text();

    const lines = raw
      .split("\n")
      .map((l) => l.replace(/^\d+[\.\)]\s*/, "").trim())
      .filter((l) => l.length > 15 && !l.startsWith("#") && !l.startsWith("*"));

    if (lines.length < count) throw new Error(`Only ${lines.length} questions returned`);

    console.log(`✅ Gemini generated ${lines.length} questions for ${role} (${difficulty})`);
    return { questions: lines.slice(0, count), source: "ai" };

  } catch (error) {
    console.error("⚠️  Gemini failed, using shuffled fallback:", error.message);

    // Shuffle the fallback pool so a different set is returned every time
    const pool = FALLBACK_POOL[role] || FALLBACK_POOL.fullstack;
    return { questions: shuffle(pool).slice(0, count), source: "fallback" };
  }
};

module.exports = { generateQuestions, FALLBACK_POOL };