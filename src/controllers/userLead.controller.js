const UserLead = require("../models/userLead.model");

exports.createLead = async (req, res) => {
    try {
        const now = new Date();

        const user_id = req.user.id;
        const { car_id, action_type } = req.body;
        const user_rigvay_id = req.user.rigvay_id;
        const phone = req.user.phone;
        const name = req.user.name ?? '';

        if (!user_id || !car_id || !action_type) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields"
            });
        }

        // 🔍 find latest lead (same user + car + action)
        const lastLead = await UserLead.findOne({
            user_id,
            car_id,
            action_type
        }).sort({ enquiry_last_date: -1 });

        // ✅ ALWAYS update latest lead (important for analytics)
        if (lastLead) {
            lastLead.enquiry_last_date = now;
            await lastLead.save();

            console.log("Lead updated for analytics tracking");

            return res.status(200).json({
                success: true,
                message: "Lead updated (tracking latest enquiry)",
                data: lastLead
            });
        }

        // 🆕 if no previous lead → create first entry
        const newLead = await UserLead.create({
            ...req.body,
            user_id,
            user_rigvay_id: user_rigvay_id,
            user_phone: phone,
            user_name: name,
            enquiry_last_date: now
        });

        console.log("New lead created");

        return res.status(200).json({
            success: true,
            message: "New lead created",
            data: newLead
        });

    } catch (error) {
        console.log("Error:", error.message);

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};