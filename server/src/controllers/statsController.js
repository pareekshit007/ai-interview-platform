const User      = require("../models/User");
const Interview = require("../models/Interview");

// Public — real platform counts for the homepage. No inflation happens
// here; the frontend is responsible for rounding these down to a
// friendly "10+" / "20+" style display.
const getPublicStats = async (req, res) => {
  try {
    const [userCount, interviewCount, answersAgg] = await Promise.all([
      User.countDocuments({}),
      Interview.countDocuments({ completed: true }),
      Interview.aggregate([
        { $match: { completed: true } },
        { $project: { answerCount: { $size: { $ifNull: ["$answers", []] } } } },
        { $group: { _id: null, total: { $sum: "$answerCount" } } },
      ]),
    ]);

    const questionsAnswered = answersAgg[0]?.total || 0;

    res.json({
      users: userCount,
      interviews: interviewCount,
      questionsAnswered,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getPublicStats };