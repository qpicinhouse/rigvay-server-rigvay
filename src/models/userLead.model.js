// models/Lead.js

const mongoose = require("mongoose");

const userLeadSchema = new mongoose.Schema({
    user_id: String,
    user_rigvay_id: String,
    user_name: String,
    user_phone: String,

    car_id: String,
    car_rigvay_id: String,
    
    dealer_id: String,
    dealer_rigvay_id : String, 
    company_name : String,
    action_type: String,

    enquiry_last_date: { type: Date, default: Date.now } // ✅ new field

}, { timestamps: true });

// ✅ unique index (important)
userLeadSchema.index(
    { user_id: 1, car_id: 1, action_type: 1 },
    { unique: true }
);

module.exports = mongoose.model("UserLead", userLeadSchema);