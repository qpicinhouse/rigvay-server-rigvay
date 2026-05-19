// controllers/adminLeadAnalytics.controller.js

const UserLead = require("../models/userLead.model");

// ✅ CSV escape
function escapeCSV(value) {
    if (value === null || value === undefined) return "";
    const str = String(value).replace(/"/g, '""');
    return `"${str}"`;
}

exports.getLeadAnalytics = async (req, res) => {
    try {
        let {
            startDate,
            endDate,
            dealer_id,
            dealer_rigvay_id,
            search,
            page = 1,
            limit = 20,
            exportCsv
        } = req.query;

        page = Number(page) || 1;
        limit = Math.min(Number(limit) || 20, 300); // Max 300 per page
        const skip = (page - 1) * limit;

        let matchStage = {};

        // 📅 Date filter (IMPORTANT → enquiry_last_date)
        if (startDate || endDate) {
            matchStage.enquiry_last_date = {};
            if (startDate) matchStage.enquiry_last_date.$gte = new Date(startDate);
            if (endDate) matchStage.enquiry_last_date.$lte = new Date(endDate);
        }

        // 🏢 Dealer filter
        if (dealer_id) matchStage.dealer_id = dealer_id;
        if (dealer_rigvay_id) matchStage.dealer_rigvay_id = dealer_rigvay_id;

        // 🔍 Search
        if (search) {
            matchStage.$or = [
                { user_phone: { $regex: search, $options: "i" } },
                { car_rigvay_id: { $regex: search, $options: "i" } }
            ];
        }

        const totalCount = await UserLead.countDocuments(matchStage);

        const leads = await UserLead.find(matchStage)
            .sort({ enquiry_last_date: -1 })
            .skip(skip)
            .limit(limit);

        const formatted = leads.map((l) => ({
            user_name: l.user_name,
            user_phone: l.user_phone,
            car_rigvay_id: l.car_rigvay_id,
            car_url: `https://rigvay.com/detail/${l.car_rigvay_id}`,
            dealer_name: l.company_name,
            dealer_rigvay_id: l.dealer_rigvay_id,
            action_type: l.action_type,
            enquiry_date: l.enquiry_last_date
        }));

        // 🔥 Top Cars
        const topCars = await UserLead.aggregate([
            { $match: { ...matchStage, car_rigvay_id: { $ne: null } } },
            { $group: { _id: "$car_rigvay_id", total: { $sum: 1 } } },
            { $sort: { total: -1 } },
            { $limit: 5 }
        ]);

        // 🔥 Top Dealers
        const topDealers = await UserLead.aggregate([
            { $match: { ...matchStage, dealer_rigvay_id: { $ne: null } } },
            {
                $group: {
                    _id: "$dealer_rigvay_id",
                    dealer_name: { $first: "$company_name" },
                    total: { $sum: 1 }
                }
            },
            { $sort: { total: -1 } },
            { $limit: 5 }
        ]);

        // 📊 Dealer Stats
        const dealerStats = await UserLead.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: "$dealer_rigvay_id",
                    dealer_name: { $first: "$company_name" },
                    call_count: {
                        $sum: { $cond: [{ $eq: ["$action_type", "CALL"] }, 1, 0] }
                    },
                    whatsapp_count: {
                        $sum: { $cond: [{ $eq: ["$action_type", "WHATSAPP"] }, 1, 0] }
                    }
                }
            }
        ]);

        // 📥 CSV EXPORT
        if (exportCsv === "true") {
            const rows = [
                ["User", "Phone", "Car ID", "Car URL", "Dealer", "Dealer ID", "Action", "Date"]
            ];

            formatted.forEach(r => {
                rows.push([
                    escapeCSV(r.user_name),

                    // 🔥 FIX HERE (IMPORTANT)
                    escapeCSV(`="${r.user_phone}"`),

                    escapeCSV(r.car_rigvay_id),
                    escapeCSV(r.car_url),
                    escapeCSV(r.dealer_name),
                    escapeCSV(r.dealer_rigvay_id),
                    escapeCSV(r.action_type),
                    escapeCSV(new Date(r.enquiry_date).toISOString())
                ]);
            });

            const csv = rows.map(r => r.join(",")).join("\n");

            res.header("Content-Type", "text/csv");
            res.header("Content-Disposition", "attachment; filename=analytics.csv");

            return res.send("\uFEFF" + csv); // ✅ BOM for Excel
        }

        return res.json({
            success: true,
            data: {
                pagination: {
                    page,
                    totalPages: Math.ceil(totalCount / limit)
                },
                leads: formatted,
                topCars,
                topDealers,
                dealerStats
            }
        });

    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};