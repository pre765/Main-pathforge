const express = require("express");
const router = express.Router();
const {
  register,
  login,
  googleAuth,
  requestSignupOtp,
  verifySignupOtp
} = require("../controllers/authController");

router.post("/register", register);
router.post("/register/request-otp", requestSignupOtp);
router.post("/register/verify-otp", verifySignupOtp);
router.post("/login", login);
router.post("/google", googleAuth);

module.exports = router;
