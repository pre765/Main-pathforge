const mongoose = require("mongoose");

const connectionSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  guider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  domain: {
    type: String,
    enum: ["AI/ML", "Cybersecurity", "Web Development", "Data Science"],
    required: true
  },

  message: {
    type: String,
    default: ""
  },

  status: {
    type: String,
    enum: ["pending", "accepted", "rejected"],
    default: "pending"
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Connection", connectionSchema);
