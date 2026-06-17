const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name:         { type: String, required: true, trim: true },
    email:        { type: String, required: true, unique: true, lowercase: true, trim: true },
    password:     { type: String, required: true, minlength: 6 },
    phone:        { type: String, default: "" },
    college:      { type: String, default: "" },
    degree:       { type: String, default: "" },
    organization: { type: String, default: "" },
    linkedin:     { type: String, default: "" },
    github:       { type: String, default: "" },
    summary:      { type: String, default: "" },
    skills:       [{ type: String }],
    profilePic:   { type: String, default: "" },
    resumeUrl:    { type: String, default: "" },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);