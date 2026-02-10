const express = require("express");
const { body } = require("express-validator");

const {
  register,
  verifyRegistrationOTP,
  loginWithEmail,
  sendLoginOTP,
  verifyLoginOTP
} = require("../controllers/userAuth.controller");

const router = express.Router();

router.post('/register', [
  body('email').isEmail(),
  body('phone').isLength({ min: 6 }),
  body('password').isLength({ min: 6 })
], register);

router.post('/verify-register', verifyRegistrationOTP);

router.post('/login', loginWithEmail);

router.post('/send-login-otp', sendLoginOTP);
router.post('/verify-login-otp', verifyLoginOTP);

module.exports = router;
