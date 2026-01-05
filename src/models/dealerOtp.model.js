const mongoose = require("mongoose");

const dealerOtpSchema = new mongoose.Schema(
  {
    email: { type: String, required: true },
    phone: { type: String, required: true },
    password: { type: String, required: true },
    otp: { type: String, required: true },
    otpExpires: { type: Date, required: true }
  },
  { timestamps: true }
);
//==========>> Auto delet expired OTP documents after otpExpires 
dealerOtpSchema.index({ otpExpires: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("DealerOTP", dealerOtpSchema);
