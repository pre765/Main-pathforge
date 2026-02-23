const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  getProfile,
  selectDomain,
  getRoadmapProgress,
  toggleRoadmapItem,
  getCommunityGuiders,
  requestGuiderConnection,
  getMyConnections,
  createCommunityPost,
  getCommunityPosts,
  addCommunityComment
} = require("../controllers/studentController");

// Search endpoint
router.get("/search", (req, res) => {
  const { q } = req.query;
  if (!q || q.trim().length === 0) {
    return res.status(400).json({ error: "Search query is required" });
  }
  // In a real app, query MongoDB. For now, mock response.
  // Example: const students = await StudentModel.find({name: {$regex: q, $options: 'i'}});
  res.json({
    success: true,
    data: [],
    message: "Connected to backend search (implement with DB)"
  });
});

router.get("/me", protect, getProfile);
router.put("/domain", protect, selectDomain);
router.get("/roadmap-progress", protect, getRoadmapProgress);
router.patch("/roadmap-progress", protect, toggleRoadmapItem);
router.get("/community/guiders", protect, getCommunityGuiders);
router.post("/community/connect/:guiderId", protect, requestGuiderConnection);
router.get("/community/connections", protect, getMyConnections);
router.post("/community/posts", protect, createCommunityPost);
router.get("/community/posts", protect, getCommunityPosts);
router.post("/community/posts/:postId/comments", protect, addCommunityComment);

module.exports = router;

