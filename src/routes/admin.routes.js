const express = require("express");
const router = express.Router();
const { registerAdmin, sendLoginOTP, verifyLoginOTP } = require("../controllers/adminAuth.controller");

router.post('/register-admin', registerAdmin);
router.post('/send-login-otp', sendLoginOTP);
router.post('/verify-login-otp', verifyLoginOTP);

module.exports = router;