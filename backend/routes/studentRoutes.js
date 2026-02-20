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
