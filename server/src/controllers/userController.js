const User = require("../models/User");
const { notify } = require("../services/notificationService");

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const allowed = [
      "name", "phone", "college", "degree", "organization",
      "linkedin", "github", "summary", "skills", "profilePic",
      "resumeUrl", "experience", "projectsText", "certificationsText",
      "offerLetters", "certificates", "projectRepos"
    ];
    const updates = {};
    allowed.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

    const user = await User.findByIdAndUpdate(
      req.user._id, { $set: updates }, { new: true, runValidators: false }
    ).select("-password");

    notify({
      userId: req.user._id,
      type: "profile_updated",
      icon: "🪪",
      title: "Profile updated",
      text: "Your profile changes have been saved.",
      link: "/profile",
    });

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getProfile, updateProfile };