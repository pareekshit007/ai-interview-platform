const Interview = require("../models/Interview");

/* ── Field detection ───────────────────────────────────────────────────────
   Auto-discovers which field your Interview model uses for the numeric
   score (totalScore / overallScore / score / finalScore) and for the
   role/topic (role / jobRole / topic / category / position).
   This means you don't need to touch your existing model at all.
   ─────────────────────────────────────────────────────────────────────── */

let _scoreField = null;
let _roleField  = null;

async function resolveScoreField() {
  if (_scoreField) return _scoreField;
  const sample = await Interview.findOne({ status: "completed" }).lean();
  const candidates = ["totalScore", "overallScore", "score", "finalScore", "avgScore"];
  if (sample) {
    for (const f of candidates) {
      if (typeof sample[f] === "number") { _scoreField = f; return f; }
    }
  }
  _scoreField = "totalScore";
  return _scoreField;
}

async function resolveRoleField() {
  if (_roleField) return _roleField;
  const sample = await Interview.findOne({ status: "completed" }).lean();
  const candidates = ["role", "jobRole", "topic", "category", "position", "jobTitle"];
  if (sample) {
    for (const f of candidates) {
      if (typeof sample[f] === "string") { _roleField = f; return f; }
    }
  }
  _roleField = "role";
  return _roleField;
}

/* ── Aggregation pipeline factory ────────────────────────────────────────── */
function buildPipeline(scoreField, matchExtra = {}, limit = 50) {
  return [
    {
      $match: {
        status: "completed",
        [scoreField]: { $exists: true, $gt: 0 },
        ...matchExtra,
      },
    },
    {
      $group: {
        _id:            "$user",
        totalScore:     { $sum:  `$${scoreField}` },
        avgScore:       { $avg:  `$${scoreField}` },
        bestScore:      { $max:  `$${scoreField}` },
        interviewCount: { $sum:  1 },
        lastAt:         { $max:  "$createdAt" },
      },
    },
    { $sort: { totalScore: -1, avgScore: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from:         "users",
        localField:   "_id",
        foreignField: "_id",
        as:           "userInfo",
      },
    },
    { $unwind: "$userInfo" },
    {
      $project: {
        _id:            0,
        userId:         "$_id",
        name:           "$userInfo.name",
        avatar: {
          $ifNull: ["$userInfo.profilePic", "$userInfo.avatar", "$userInfo.photo", null],
        },
        totalScore:     1,
        avgScore:       { $round: ["$avgScore", 1] },
        bestScore:      1,
        interviewCount: 1,
        lastAt:         1,
      },
    },
    // add 1-based rank
    { $group: { _id: null, users: { $push: "$$ROOT" } } },
    { $unwind: { path: "$users", includeArrayIndex: "rank" } },
    {
      $replaceRoot: {
        newRoot: { $mergeObjects: ["$users", { rank: { $add: ["$rank", 1] } }] },
      },
    },
  ];
}

/* ── Controllers ──────────────────────────────────────────────────────────── */

/**
 * GET /api/leaderboard
 */
exports.getGlobalLeaderboard = async (req, res) => {
  try {
    const scoreField = await resolveScoreField();
    const data = await Interview.aggregate(buildPipeline(scoreField, {}, 50));
    res.json({ success: true, count: data.length, data });
  } catch (err) {
    console.error("getGlobalLeaderboard:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * GET /api/leaderboard/topic/:topic
 */
exports.getTopicLeaderboard = async (req, res) => {
  try {
    const { topic } = req.params;
    const [scoreField, roleField] = await Promise.all([
      resolveScoreField(),
      resolveRoleField(),
    ]);
    const matchExtra = { [roleField]: new RegExp(`^${topic}$`, "i") };
    const data = await Interview.aggregate(buildPipeline(scoreField, matchExtra, 50));
    res.json({ success: true, topic, count: data.length, data });
  } catch (err) {
    console.error("getTopicLeaderboard:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * GET /api/leaderboard/my-rank
 */
exports.getMyRank = async (req, res) => {
  try {
    const userId     = req.user._id;
    const scoreField = await resolveScoreField();

    // Full list without limit so we get the real position
    const fullPipeline = [
      {
        $match: { status: "completed", [scoreField]: { $exists: true, $gt: 0 } },
      },
      {
        $group: {
          _id:            "$user",
          totalScore:     { $sum:  `$${scoreField}` },
          avgScore:       { $avg:  `$${scoreField}` },
          bestScore:      { $max:  `$${scoreField}` },
          interviewCount: { $sum:  1 },
        },
      },
      { $sort: { totalScore: -1, avgScore: -1 } },
      {
        $lookup: {
          from: "users", localField: "_id", foreignField: "_id", as: "userInfo",
        },
      },
      { $unwind: "$userInfo" },
      {
        $project: {
          _id:  0,
          userId: "$_id",
          name:   "$userInfo.name",
          avatar: { $ifNull: ["$userInfo.profilePic", "$userInfo.avatar", null] },
          totalScore:     1,
          avgScore:       { $round: ["$avgScore", 1] },
          bestScore:      1,
          interviewCount: 1,
        },
      },
      { $group: { _id: null, users: { $push: "$$ROOT" } } },
      { $unwind: { path: "$users", includeArrayIndex: "rank" } },
      {
        $replaceRoot: {
          newRoot: { $mergeObjects: ["$users", { rank: { $add: ["$rank", 1] } }] },
        },
      },
    ];

    const all     = await Interview.aggregate(fullPipeline);
    const myIndex = all.findIndex((u) => u.userId.toString() === userId.toString());

    if (myIndex === -1) {
      return res.json({
        success:           true,
        myRank:            null,
        totalParticipants: all.length,
        message:           "Complete at least one interview to appear on the leaderboard",
        nearby:            [],
      });
    }

    const start  = Math.max(0, myIndex - 5);
    const end    = Math.min(all.length, myIndex + 6);

    res.json({
      success:           true,
      myRank:            all[myIndex].rank,
      totalParticipants: all.length,
      me:                all[myIndex],
      nearby:            all.slice(start, end),
    });
  } catch (err) {
    console.error("getMyRank:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};