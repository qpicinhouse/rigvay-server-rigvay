const mongoose = require("mongoose");

const dealerProfileSchema = new mongoose.Schema(
  {
    dealer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Dealer",
      required: true,
      unique: true,
    },
    // unique rigvay id (10 digits)
    rigvay_id: { type: String, unique: true, sparse: true },
    profileImageUrl: { type: String },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    companyName: { type: String, required: true },
    aboutCompany: { type: String },
    companyPhone: { type: String, required: true },
    companyEmail: { type: String, required: true },
    companyWhatsapp: { type: String, required: true },
   
    addressLine1: { type: String, required: true },
    addressLine2: { type: String, required: true },
    addressLine3: { type: String, required: false },
    pincode: { type: String, required: true },
    district: { type: String, required: true },
    state: { type: String, required: true },
    website: { type: String },
    facebook: { type: String },
    instagram: { type: String },
    adminApproved: { type: Boolean, default: false },
    // freeAccess: { type: Boolean, default: false },
    // subscription: { type: mongoose.Schema.Types.ObjectId, ref: "Subscription" },
  },
  { timestamps: true }
);

const DealerProfile = mongoose.model("DealerProfile", dealerProfileSchema);
module.exports = DealerProfile;
