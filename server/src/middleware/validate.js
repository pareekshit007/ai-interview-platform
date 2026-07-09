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

const validateSendOtp = [
  body("name")
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage("Name must be under 50 characters"),

  body("email")
    .trim()
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Enter a valid email address")
    .normalizeEmail(),

  handleValidation,
];

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

  body("otp")
    .trim()
    .notEmpty().withMessage("Verification code is required")
    .isLength({ min: 6, max: 6 }).withMessage("Verification code must be 6 digits")
    .isNumeric().withMessage("Verification code must be numeric"),

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

const validateForgotPassword = [
  body("email")
    .trim()
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Enter a valid email address")
    .normalizeEmail(),

  handleValidation,
];

const validateResetPassword = [
  body("email")
    .trim()
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Enter a valid email address")
    .normalizeEmail(),

  body("otp")
    .trim()
    .notEmpty().withMessage("Verification code is required")
    .isLength({ min: 6, max: 6 }).withMessage("Verification code must be 6 digits")
    .isNumeric().withMessage("Verification code must be numeric"),

  body("newPassword")
    .notEmpty().withMessage("New password is required")
    .isLength({ min: 6 }).withMessage("Password must be at least 6 characters")
    .matches(/[A-Za-z]/).withMessage("Password must contain at least one letter")
    .matches(/[0-9]/).withMessage("Password must contain at least one number"),

  handleValidation,
];

const validateChangePassword = [
  body("currentPassword")
    .notEmpty().withMessage("Current password is required"),

  body("newPassword")
    .notEmpty().withMessage("New password is required")
    .isLength({ min: 6 }).withMessage("Password must be at least 6 characters")
    .matches(/[A-Za-z]/).withMessage("Password must contain at least one letter")
    .matches(/[0-9]/).withMessage("Password must contain at least one number"),

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

  body("company")
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 50 }).withMessage("Invalid company"),

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

  // ✅ FIX: Accept numeric 0-100 OR legacy string labels (High/Medium/Low etc.)
  body("answers.*.confidence")
    .optional()
    .custom((val) => {
      if (val === undefined || val === null) return true;
      if (typeof val === "string") return true; // legacy string labels
      const n = Number(val);
      if (!isNaN(n) && n >= 0 && n <= 100) return true;
      throw new Error("confidence must be 0–100 or a label string");
    }),

  body("answers.*.clarity")
    .optional()
    .custom((val) => {
      if (val === undefined || val === null) return true;
      if (typeof val === "string") return true;
      const n = Number(val);
      if (!isNaN(n) && n >= 0 && n <= 100) return true;
      throw new Error("clarity must be 0–100 or a label string");
    }),

  body("answers.*.sentiment")
    .optional()
    .custom((val) => {
      if (val === undefined || val === null) return true;
      if (typeof val === "string") return true;
      const n = Number(val);
      if (!isNaN(n) && n >= 0 && n <= 100) return true;
      throw new Error("sentiment must be 0–100 or a label string");
    }),

  handleValidation,
];

// ── AI ───────────────────────────────────────────────────────────────────────

const validateGetQuestions = [
  body("role")
    .optional()
    .trim()
    .isIn(VALID_ROLES).withMessage(`Role must be one of: ${VALID_ROLES.join(", ")}`),

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

// ── Resume-based interview ─────────────────────────────────────────────────

const validateSubmitResumeInterview = [
  param("id")
    .isMongoId().withMessage("Invalid interview ID"),

  body("answers")
    .isArray({ min: 1, max: 20 }).withMessage("answers must be a non-empty array (max 20)"),

  body("answers.*.questionIndex")
    .isInt({ min: 0 }).withMessage("questionIndex must be a non-negative integer"),

  body("answers.*.questionText")
    .trim()
    .notEmpty().withMessage("questionText is required")
    .isLength({ max: 500 }).withMessage("questionText too long"),

  body("answers.*.transcript")
    .optional()
    .trim()
    .isLength({ max: 5000 }).withMessage("transcript too long (max 5000 chars)"),

  body("answers.*.phase")
    .optional({ nullable: true })
    .isIn(["technical", "hr"]).withMessage("phase must be technical or hr"),

  body("proctor.violations")
    .optional()
    .isInt({ min: 0, max: 1000 }).withMessage("proctor.violations must be a non-negative integer"),

  body("proctor.flagged")
    .optional()
    .isBoolean().withMessage("proctor.flagged must be boolean"),

  body("proctor.log")
    .optional()
    .isArray({ max: 50 }).withMessage("proctor.log must be an array (max 50 entries)"),

  handleValidation,
];

module.exports = {
  validateSendOtp,
  validateRegister,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
  validateChangePassword,
  validateUpdateProfile,
  validateStartInterview,
  validateSubmitInterview,
  validateGetQuestions,
  validateAnswerFeedback,
  validateSessionFeedback,
  validateSubmitResumeInterview,
};