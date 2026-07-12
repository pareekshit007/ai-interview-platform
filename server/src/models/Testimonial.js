const mongoose = require("mongoose");

const testimonialSchema = new mongoose.Schema(
  {
    user:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    name:   { type: String, required: true, trim: true },
    role:   { type: String, default: "" },   // e.g. college / organization, shown under the name
    quote:  { type: String, required: true, trim: true, maxlength: 400 },
    rating: { type: Number, required: true, min: 1, max: 5 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Testimonial", testimonialSchema);