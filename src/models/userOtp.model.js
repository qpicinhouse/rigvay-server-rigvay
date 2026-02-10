const mongoose = require("mongoose");

const userOtpSchema = new mongoose.Schema({
  email: String,
  phone: String,
  password: String,
  otp: String,
  otpExpires: Date
}, { timestamps: true });
//==========>> Auto delet expired OTP documents after otpExpires <<=============
userOtpSchema.index({ otpExpires: 1 }, { expireAfterSeconds: 0 });
module.exports = mongoose.model("UserOTP", userOtpSchema);
