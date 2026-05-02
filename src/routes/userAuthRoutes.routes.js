const express = require("express");
const { body } = require("express-validator");

const {
  sendOtp, verifyOtp
} = require("../controllers/userAuth.controller");

const router = express.Router();

router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);

module.exports = router;
