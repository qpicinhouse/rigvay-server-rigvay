const express = require("express");

const { body } = require("express-validator");

const {
  register,
  verifyRegistrationOTP,
  loginWithEmail,
  sendLoginOTP,
  verifyLoginOTP,
  forgotPassword,
  verifyResetOTP,
  resetPassword
} = require("../controllers/dealerAuthController.js");


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

router.post('/forgot-password', forgotPassword);
router.post('/verify-reset-otp',verifyResetOTP);

router.post('/reset-password', [
  body('resetToken').notEmpty(),
  body('newPassword').isLength({ min: 6 }),
  body('confirmPassword').isLength({ min: 6 })
], resetPassword);

module.exports = router;