const express = require("express");
const router = express.Router();

// GET
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
