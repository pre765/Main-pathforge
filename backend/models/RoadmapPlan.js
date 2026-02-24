const mongoose = require("mongoose");

const roadmapPlanSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    goalText: {
      type: String,
      required: true
    },
    timeframeWeeks: {
      type: Number,
      required: true
    },
    domain: {
      type: String,
      required: true
    },
    plan: {
      type: Array,
      default: []
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("RoadmapPlan", roadmapPlanSchema);
