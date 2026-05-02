// services/leadService.js

const UserLead = require("../models/userLead.model");

exports.createLead = async (data) => {
    try {
        const now = new Date();

        // 🔍 check existing
        const exists = await Lead.findOne({
            user_id: data.user_id,
            car_id: data.car_id,
            action_type: data.action_type
        });

        // ✅ If exists → update last enquiry date
        if (exists) {
            exists.enquiry_last_date = now;
            await exists.save();

            return {
                success: true,
                message: "Lead updated (repeat enquiry)",
                data: exists
            };
        }

        // ✅ else → create new
        const newLead = await Lead.create({
            ...data,
            enquiry_last_date: now
        });

        return {
            success: true,
            message: "Lead created",
            data: newLead
        };

    } catch (error) {
        throw new Error(error.message);
    }
};