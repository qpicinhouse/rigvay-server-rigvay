const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String },
  phone: { type: String, unique: true, required: true },
  rigvay_id: { type: String, unique: true },
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);