const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  generateInterviewQuestion,
  scoreInterviewResponse,
  getInterviewHeatmap,
  generateRoadmapPlan
} = require("../controllers/aiController");

router.post("/interview/question", protect, generateInterviewQuestion);
router.post("/interview/score", protect, scoreInterviewResponse);
router.get("/interview/heatmap", protect, getInterviewHeatmap);
router.post("/roadmap/auto-build", protect, generateRoadmapPlan);

module.exports = router;
