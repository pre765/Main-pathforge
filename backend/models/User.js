const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ["student", "guider"],
    default: "student"
  },
  selectedDomain: {
    type: String,
    enum: ["AI/ML", "Cybersecurity", "Web Development", "Data Science"],
    default: null
  },
  skillLevel: {
    type: String,
    enum: ["beginner", "intermediate", "advanced"],
    default: "beginner"
  },
  completedRoadmapItems: {
    type: [String],
    default: []
  }
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
