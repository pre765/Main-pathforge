const express = require("express");
const router = express.Router();
const { createGuider, getGuiders } = require("../controllers/guiderController");

router.get("/", getGuiders);
router.post("/", createGuider);

module.exports = router;
