const express = require("express");
const router = express.Router();

const {
  sendRequest,
  acceptRequest,
  getGuiderRequests,
  getGuiders
} = require("../controllers/requestController");

router.get("/guiders", getGuiders);
router.post("/send", sendRequest);
router.put("/accept", acceptRequest);
router.get("/guider/:guiderId", getGuiderRequests);

module.exports = router;
