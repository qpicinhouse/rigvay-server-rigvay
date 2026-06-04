const mongoose = require("mongoose");
const Car = require("../models/Car.model");
const Dealer = require("../models/dealer.model");

exports.getFilteredDownloadCars = async (req, res) => {
  try {
    const { type, startDate, dealerId, rigvay_id , showDeleted} = req.query;

    let filter = {
      // isDeleted: false,
      status: "live"
    };

    // Deleted checkbox logic
    if (showDeleted === "true") {
      filter.isDeleted = true;
    } else {
      filter.isDeleted = false;
    }
    /* ================= DEALER FIND (rigvay_id) ================= */
    let finalDealerId = dealerId;

    if (rigvay_id) {
      const dealer = await Dealer.findOne({ rigvay_id });

      if (!dealer) {
        return res.status(404).json({
          success: false,
          message: "Dealer not found"
        });
      }

      finalDealerId = dealer._id;
    }

    /* ================= DEALER FILTER ================= */
    if (finalDealerId) {
      filter.dealer = new mongoose.Types.ObjectId(finalDealerId);
    }

    /* ================= DATE FILTER ================= */

    // ✅ Today only
    if (type === "today") {
      const start = new Date();
      start.setHours(0, 0, 0, 0);

      const end = new Date();
      end.setHours(23, 59, 59, 999);

      filter.createdAt = { $gte: start, $lte: end };
    }

    // ✅ Start date → Today
    else if (startDate) {
      const start = new Date(startDate);

      const end = new Date(); // today

      filter.createdAt = {
        $gte: start,
        $lte: end
      };
    }

    /* ================= FETCH ================= */
    const { limit = 300 } = req.query;
    const cars = await Car.find(filter)
      .populate("dealer", "email phone rigvay_id")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      count: cars.length,
      data: cars
    });

  } catch (error) {
    console.error("getFilteredCars error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error"
    });
  }
};