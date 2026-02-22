const express = require("express");
const router = express.Router();

const {
  sendRequest,
  acceptRequest,
  getGuiderRequests
} = require("../controllers/requestController");

router.post("/send", sendRequest);
router.put("/accept", acceptRequest);
router.get("/guider/:guiderId", getGuiderRequests);

module.exports = router;