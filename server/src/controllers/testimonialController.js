const Testimonial = require("../models/Testimonial");
const Interview   = require("../models/Interview");

// Public — latest real testimonials only. If nobody has left one yet,
// this returns an empty array and the frontend hides the section
// rather than showing placeholder people.
const getTestimonials = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 6, 20);
    const testimonials = await Testimonial.find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .select("name role quote rating createdAt");
    res.json(testimonials);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Authenticated — lets a user check whether they've already left a
// testimonial, so the frontend can hide the "share your experience" form.
const getMyTestimonial = async (req, res) => {
  try {
    const mine = await Testimonial.findOne({ user: req.user._id });
    res.json({ submitted: !!mine, testimonial: mine || null });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Authenticated — only users who've actually completed an interview can
// leave one, and only once (unique index on `user` backs this up too).
const createTestimonial = async (req, res) => {
  try {
    const { quote, rating } = req.body;

    if (!quote || !quote.trim()) {
      return res.status(400).json({ message: "Please write a short quote about your experience." });
    }
    const ratingNum = Number(rating);
    if (!ratingNum || ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({ message: "Please select a rating between 1 and 5." });
    }

    const completedCount = await Interview.countDocuments({ user: req.user._id, completed: true });
    if (completedCount === 0) {
      return res.status(403).json({ message: "Complete at least one mock interview before sharing feedback." });
    }

    const existing = await Testimonial.findOne({ user: req.user._id });
    if (existing) {
      return res.status(409).json({ message: "You've already shared your feedback — thank you!" });
    }

    const testimonial = await Testimonial.create({
      user:  req.user._id,
      name:  req.user.name,
      role:  req.user.organization || req.user.college || "",
      quote: quote.trim().slice(0, 400),
      rating: ratingNum,
    });

    res.status(201).json(testimonial);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "You've already shared your feedback — thank you!" });
    }
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getTestimonials, getMyTestimonial, createTestimonial };