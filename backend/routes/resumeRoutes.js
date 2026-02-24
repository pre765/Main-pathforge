const express = require("express");
const router = express.Router();

const { analyzeResume, uploadResume } = require("../controllers/resumeController");

router.post("/analyze", analyzeResume);
router.post("/upload", uploadResume);

module.exports = router;
