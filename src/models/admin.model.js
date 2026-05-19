const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema(
  {
    phone: { type: String, required: true, unique: true },
    otp: { type: String },
    otpExpires: { type: Date },

    permissions: [
      {
        type: String,
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Admin", adminSchema);