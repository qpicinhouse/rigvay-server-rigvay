const mongoose = require("mongoose");

const planSchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      required: true, 
      unique: true,
      enum: ['Starter', 'Pro', 'Max', 'Ultra', 'Ultra Max']
    },
    amount: { type: Number, required: true },
    durationMonths: { type: Number, required: true },
    carLimit: { type: Number, default: 0 },
    unlimited: { type: Boolean, default: false },
    discount: { type: Number, default: 0 },
    features: [{ type: String }],
    active: { type: Boolean, default: true },
    displayAmount: { type: String, required: true },
    discountText: { type: String }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Plan", planSchema);