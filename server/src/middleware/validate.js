const { body, param, validationResult } = require("express-validator");

// Runs after validation chains — returns 400 with all errors if any fail
const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: "Validation failed",
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

// ── Auth ────────────────────────────────────────────────────────────────────

const validateRegister = [
  body("name")
    .trim()
    .notEmpty().withMessage("Name is required")
    .isLength({ min: 2, max: 50 }).withMessage("Name must be 2–50 characters"),

  body("email")
    .trim()
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Enter a valid email address")
    .normalizeEmail(),

  body("password")
    .notEmpty().withMessage("Password is required")
    .isLength({ min: 6 }).withMessage("Password must be at least 6 characters")
    .matches(/[A-Za-z]/).withMessage("Password must contain at least one letter")
    .matches(/[0-9]/).withMessage("Password must contain at least one number"),

  handleValidation,
];

const validateLogin = [
  body("email")
    .trim()
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Enter a valid email address")
    .normalizeEmail(),

  body("password")
    .notEmpty().withMessage("Password is required"),

  handleValidation,
];

// ── User profile ─────────────────────────────────────────────────────────────

const validateUpdateProfile = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage("Name must be 2–50 characters"),

  body("phone")
    .optional()
    .trim()
    .custom((val) => {
      if (val && val !== "" && !/^[+\d\s\-().]{7,20}$/.test(val))
        throw new Error("Enter a valid phone number");
      return true;
    }),

  body("linkedin")
    .optional()
    .trim()
    .custom((val) => {
      if (val && !val.startsWith("https://linkedin.com") && !val.startsWith("https://www.linkedin.com"))
        throw new Error("LinkedIn URL must start with https://linkedin.com");
      return true;
    }),

  body("github")
    .optional()
    .trim()
    .custom((val) => {
      if (val && !val.startsWith("https://github.com"))
        throw new Error("GitHub URL must start with https://github.com");
      return true;
    }),

  body("skills")
    .optional()
    .isArray({ max: 30 }).withMessage("Skills must be an array (max 30)"),

  body("skills.*")
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 }).withMessage("Each skill must be 1–50 characters"),

  body("summary")
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage("Summary must be under 2000 characters"),

  body("experience")
    .optional()
    .trim()
    .isLength({ max: 5000 }).withMessage("Experience must be under 5000 characters"),

  body("projectsText")
    .optional()
    .trim()
    .isLength({ max: 5000 }).withMessage("Projects must be under 5000 characters"),

  body("certificationsText")
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage("Certifications must be under 2000 characters"),

  body("college").optional().trim(),
  body("degree").optional().trim(),
  body("organization").optional().trim(),
  body("profilePic").optional(),
  body("resumeUrl").optional(),
  body("offerLetters").optional(),
  body("certificates").optional(),
  body("projectRepos").optional(),

  handleValidation,
];

// ── Interview ────────────────────────────────────────────────────────────────

const VALID_ROLES = [
  "frontend", "backend", "fullstack", "devops", "datascience",
  "dsa", "hr", "aiml", "security", "data"
];
const VALID_DIFFICULTIES = ["easy", "medium", "hard"];

const validateStartInterview = [
  body("role")
    .trim()
    .notEmpty().withMessage("Role is required")
    .isIn(VALID_ROLES).withMessage(`Role must be one of: ${VALID_ROLES.join(", ")}`),

  body("difficulty")
    .optional()
    .isIn(VALID_DIFFICULTIES).withMessage(`Difficulty must be one of: ${VALID_DIFFICULTIES.join(", ")}`),

  body("questions")
    .isArray({ min: 1, max: 20 }).withMessage("questions must be a non-empty array (max 20)"),

  body("questions.*")
    .trim()
    .isLength({ min: 5, max: 500 }).withMessage("Each question must be 5–500 characters"),

  handleValidation,
];

const validateSubmitInterview = [
  param("id")
    .isMongoId().withMessage("Invalid interview ID"),

  body("answers")
    .isArray({ min: 1 }).withMessage("answers must be a non-empty array"),

  body("answers.*.questionIndex")
    .isInt({ min: 0 }).withMessage("questionIndex must be a non-negative integer"),

  body("answers.*.questionText")
    .trim()
    .notEmpty().withMessage("questionText is required"),

  body("answers.*.score")
    .optional()
    .isFloat({ min: 0, max: 100 }).withMessage("score must be 0–100"),

  body("answers.*.confidence")
    .optional()
    .isFloat({ min: 0, max: 100 }).withMessage("confidence must be 0–100"),

  body("answers.*.clarity")
    .optional()
    .isFloat({ min: 0, max: 100 }).withMessage("clarity must be 0–100"),

  body("answers.*.sentiment")
    .optional()
    .isFloat({ min: 0, max: 100 }).withMessage("sentiment must be 0–100"),

  handleValidation,
];

// ── AI ───────────────────────────────────────────────────────────────────────

const validateGetQuestions = [
  body("difficulty")
    .optional()
    .isIn(VALID_DIFFICULTIES).withMessage(`Difficulty must be one of: ${VALID_DIFFICULTIES.join(", ")}`),

  body("count")
    .optional()
    .isInt({ min: 1, max: 20 }).withMessage("count must be an integer between 1 and 20"),

  handleValidation,
];

const validateAnswerFeedback = [
  body("question")
    .trim()
    .notEmpty().withMessage("question is required")
    .isLength({ max: 500 }).withMessage("question too long"),

  body("transcript")
    .trim()
    .notEmpty().withMessage("transcript is required")
    .isLength({ max: 5000 }).withMessage("transcript too long (max 5000 chars)"),

  handleValidation,
];

const validateSessionFeedback = [
  body("role")
    .trim()
    .notEmpty().withMessage("role is required")
    .isIn(VALID_ROLES).withMessage(`Role must be one of: ${VALID_ROLES.join(", ")}`),

  body("answers")
    .isArray({ min: 1 }).withMessage("answers must be a non-empty array"),

  body("totalScore")
    .optional()
    .isFloat({ min: 0, max: 100 }).withMessage("totalScore must be 0–100"),

  handleValidation,
];

module.exports = {
  validateRegister,
  validateLogin,
  validateUpdateProfile,
  validateStartInterview,
  validateSubmitInterview,
  validateGetQuestions,
  validateAnswerFeedback,
  validateSessionFeedback,
};