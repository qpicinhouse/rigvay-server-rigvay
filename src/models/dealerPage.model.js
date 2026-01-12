const mongoose = require("mongoose");

const dealerPageSchema = new mongoose.Schema(
  {
    dealer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Dealer",
      required: true,
      unique: true,
    },
    bannerOneUrl: { type: String, required: true },
    bannerTwoUrl: { type: String },
    videoUrl: { type: String },
  },
  { timestamps: true }
);

const DealerPage = mongoose.model("DealerPage", dealerPageSchema);
module.exports = DealerPage;