const mongoose = require("mongoose");

const interviewAttemptSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    domain: {
      type: String,
      required: true
    },
    question: {
      type: String,
      required: true
    },
    response: {
      type: String,
      required: true
    },
    scores: {
      communication: Number,
      correctness: Number,
      structure: Number,
      depth: Number,
      tradeoffs: Number,
      systemsThinking: Number,
      problemSolving: Number
    },
    summary: String,
    strengths: [String],
    improvements: [String]
  },
  { timestamps: true }
);

module.exports = mongoose.model("InterviewAttempt", interviewAttemptSchema);
