
const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema(
  {
    dealer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Dealer",
      required: true,
    },
    plan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Plan",
      required: true,
    },
    planName: { type: String, required: true },
    amount: { type: Number, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    carLimit: { type: Number, default: 0 },
    unlimited: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },
    paymentStatus: { 
      type: String, 
      enum: ['pending', 'completed', 'failed'],
      default: 'pending'
    }
  },
  { timestamps: true }
);

// Index for faster queries
subscriptionSchema.index({ dealer: 1, active: 1, endDate: 1 });

module.exports = mongoose.model("Subscription", subscriptionSchema);

