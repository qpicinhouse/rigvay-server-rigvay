const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String},
  phone: { type: String, unique: true , require : true},
  // password: { type: String, required: true },
  rivuser_id: { type: String, unique: true },
  // otp: String,
  // otpExpires: Date
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
