const mongoose = require("mongoose");

const dealerSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    rigvay_id: {type: String, unique: true, index: true},
    // isVerified: { type: Boolean, default: false },
    otp: { type: String },
    otpExpires: { type: Date },
  },
  { timestamps: true }
);

const Dealer = mongoose.model("Dealer", dealerSchema);
module.exports = Dealer;