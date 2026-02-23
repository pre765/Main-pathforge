const express = require("express");
const router = express.Router();

// GET - Search guiders by name
router.get("/search", (req, res) => {
  const { q } = req.query;
  if (!q || q.trim().length === 0) {
    return res.status(400).json({ error: "Search query is required" });
  }
  // In a real app, query MongoDB. For now, mock response.
  // Example: const guides = await GuiderModel.find({name: {$regex: q, $options: 'i'}});
  res.json({
    success: true,
    data: [],
    message: "Connected to backend search (implement with DB)"
  });
});

// GET - Get all guiders
router.get("/", (req, res) => {
  res.json({ message: "All guiders" });
});

// POST
router.post("/", (req, res) => {
  res.json({ message: "Guider created" });
});

// PUT
router.put("/:id", (req, res) => {
  res.json({ message: "Guider updated" });
});

// DELETE
router.delete("/:id", (req, res) => {
  res.json({ message: "Guider deleted" });
});

module.exports = router;
