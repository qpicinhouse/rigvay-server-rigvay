const DealerProfile = require("../models/dealerProfile.model");
const Subscription = require("../models/subscription.model");
const Plan = require("../models/Plan.model");
const { ApiResponse } = require("../utils/ApiResponse");
const { calculatePlanEndDate } = require("../utils/dateUtils");
const {dealerApprovedEmail} = require("../utils/emailTemplates");
const {sendEmail} = require("../utils/sendEmail");
/* ---------------------------------------------------
   GET ALL DEALERS (with current subscription info)
--------------------------------------------------- */
module.exports.getAllDealers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || "";
    const skip = (page - 1) * limit;
    let matchStage = {};

    /* ================= SEARCH ================= */
    if (search.trim().length >= 2) {
      const cleanedSearch = search.trim().replace(/\s+/g, " ");
      const regex = new RegExp(cleanedSearch, "i");
      const words = cleanedSearch.split(" ");
      matchStage = {
        $or: [
          { firstName: regex },
          { lastName: regex },
          { rigvay_id: regex },
          { email: regex },
          // 🔥 Full name search support
          {
            $and: words.map(word => ({
              $or: [
                { firstName: new RegExp(word, "i") },
                { lastName: new RegExp(word, "i") }
              ]
            }))
          }
        ]
      };
    }
    const result = await DealerProfile.aggregate([
      { $match: matchStage },
      { $sort: { createdAt: -1 } },
      {
        $facet: {
          data: [
            { $skip: skip },
            { $limit: limit }
          ],
          totalCount: [
            { $count: "count" }
          ]
        }
      }
    ]);

    const dealers = result[0].data;
    const totalDealers = result[0].totalCount[0]?.count || 0;

    return res.status(200).json({
      success: true,
      message: "Dealers fetched successfully",
      data: dealers,
      pagination: {
        total: totalDealers,
        page,
        limit,
        totalPages: Math.ceil(totalDealers / limit)
      }
    });
  } catch (err) {
    console.error("getAllDealers error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
      data: null
    });
  }
};

/* ---------------------------------------------------
   GET UNAPPROVED DEALERS
--------------------------------------------------- */
module.exports.getUnapprovedDealers = async (req, res) => {
  try {
    const dealers = await DealerProfile.find({ adminApproved: false })
      .populate("dealer", "email phone");

    return res.status(200).json(
      new ApiResponse(200, "Unapproved dealers fetched", dealers)
    );
  } catch (err) {
    console.error("getUnapprovedDealers error:", err);
    return res.status(500).json(
      new ApiResponse(500, "Server error", null)
    );
  }
};

/* ---------------------------------------------------
   APPROVE DEALER + ASSIGN FREE TRIAL (ONCE)
--------------------------------------------------- */
module.exports.approveDealer = async (req, res) => {
  try {
    const { id } = req.params; // DealerProfile._id

    const profile = await DealerProfile.findById(id);
    if (!profile) {
      return res.status(404).json(
        new ApiResponse(404, "Dealer profile not found", null)
      );
    }

    if (profile.adminApproved) {
      return res.status(400).json(
        new ApiResponse(400, "Dealer already approved", null)
      );
    }

    // 1️⃣ Approve dealer
    profile.adminApproved = true;
    await profile.save();
    // Send approval email
    const dealerName = `${profile.firstName} ${profile.lastName}`;
    await sendEmail({
      to: profile.email,
      subject: "Your Dealer Account is Approved",
      html: dealerApprovedEmail(dealerName)
    });
    // 2️⃣ Fetch Free Trial plan
    const freePlan = await Plan.findOne({ name: "Free Trial" });

    if (!freePlan) {
      return res.status(500).json(
        new ApiResponse(500, "Free Trial plan not configured", null)
      );
    }

    // 3️⃣ Ensure trial is only given once
    const alreadyUsedTrial = await Subscription.exists({
      dealer: profile.dealer,
      planName: "Free Trial"
    });

    if (!alreadyUsedTrial) {
      const startDate = new Date();
      const endDate = calculatePlanEndDate(startDate, freePlan.durationMonths);

      await Subscription.create({
        dealer: profile.dealer, // Dealer._id
        plan: freePlan._id,
        planName: freePlan.name,
        amount: 0,
        startDate,
        endDate,
        carLimit: freePlan.carLimit,
        unlimited: freePlan.unlimited,
        active: true,
        paymentStatus: "completed"
      });
    }

    return res.status(200).json(
      new ApiResponse(
        200,
        "Dealer approved and free trial assigned",
        profile
      )
    );
  } catch (err) {
    console.error("approveDealer error:", err);
    return res.status(500).json(
      new ApiResponse(500, "Internal server error", null)
    );
  }
};

/* ---------------------------------------------------
   Rejected DEALER 
--------------------------------------------------- */
module.exports.rejectDealer = async (req, res) => {
  try {
    const { id } = req.params; // DealerProfile._id

    const profile = await DealerProfile.findById(id);

    if (!profile) {
      return res.status(404).json(
        new ApiResponse(404, "Dealer profile not found", null)
      );
    }

    if (!profile.adminApproved) {
      return res.status(400).json(
        new ApiResponse(400, "Dealer already rejected", null)
      );
    }
    profile.adminApproved = false;
    await profile.save();
    return res.status(200).json(
      new ApiResponse(200, "Dealer rejected successfully", profile)
    );

  } catch (error) {
    return res.status(500).json(
      new ApiResponse(500, "Server error", null)
    );
  }
};

/* ---------------------------------------------------
   GET ALL PLANS (ADMIN)
--------------------------------------------------- */
module.exports.getAllPlansForAdmin = async (req, res) => {
  try {
    const plans = await Plan.find({ active: true }).sort({ amount: 1 });

    return res.status(200).json(
      new ApiResponse(200, "All plans fetched", plans)
    );
  } catch (err) {
    console.error("getAllPlansForAdmin error:", err);
    return res.status(500).json(
      new ApiResponse(500, "Server error", null)
    );
  }
};

/* ---------------------------------------------------
   ASSIGN PLAN TO DEALER (ADMIN OVERRIDE)
--------------------------------------------------- */
module.exports.assignPlanToDealer = async (req, res) => {
  try {
    const { dealerProfileId, planId } = req.body;

    if (!dealerProfileId || !planId) {
      return res.status(400).json(
        new ApiResponse(400, "dealerProfileId and planId are required", null)
      );
    }

    const profile = await DealerProfile.findById(dealerProfileId);
    if (!profile) {
      return res.status(404).json(
        new ApiResponse(404, "Dealer profile not found", null)
      );
    }

    const plan = await Plan.findById(planId);
    if (!plan || !plan.active) {
      return res.status(404).json(
        new ApiResponse(404, "Plan not found or inactive", null)
      );
    }

    // 🔒 Block Free Trial admin re-assign
    if (plan.name === "Free Trial") {
      const alreadyUsedTrial = await Subscription.exists({
        dealer: profile.dealer,
        planName: "Free Trial"
      });

      if (alreadyUsedTrial) {
        return res.status(400).json(
          new ApiResponse(400, "Free Trial can only be used once", null)
        );
      }
    }

    // 1️⃣ Deactivate existing subscriptions
    await Subscription.updateMany(
      { dealer: profile.dealer, active: true },
      { active: false }
    );

    // 2️⃣ Create new subscription
    const startDate = new Date();
    const endDate = calculatePlanEndDate(startDate, plan.durationMonths);

    const subscription = await Subscription.create({
      dealer: profile.dealer,
      plan: plan._id,
      planName: plan.name,
      amount: plan.amount,
      startDate,
      endDate,
      carLimit: plan.carLimit,
      unlimited: plan.unlimited,
      active: true,
      paymentStatus: "completed",
      razorpayOrderId: "ADMIN_ASSIGNED"
    });

    return res.status(200).json(
      new ApiResponse(
        200,
        "Plan assigned to dealer successfully",
        subscription
      )
    );
  } catch (err) {
    console.error("assignPlanToDealer error:", err);
    return res.status(500).json(
      new ApiResponse(500, "Server error", null)
    );
  }
};

/* ---------------------------------------------------
   SEARCH DEALERS
--------------------------------------------------- */
module.exports.searchDealers = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json(
        new ApiResponse(400, "Search query must be at least 2 characters", [])
      );
    }

    const cleanedSearch = q.trim().replace(/\s+/g, " ");
    const regex = new RegExp(cleanedSearch, "i");
    const words = cleanedSearch.split(" ");

    /* ================= MATCH ================= */
    const matchStage = {
      $or: [
        { firstName: regex },
        { lastName: regex },
        { rigvay_id: regex },
        { email: regex },
        { companyName: regex },

        // FULL NAME SEARCH (same as getAllDealers)
        {
          $and: words.map(word => ({
            $or: [
              { firstName: new RegExp(word, "i") },
              { lastName: new RegExp(word, "i") }
            ]
          }))
        }
      ]
    };

    /* ================= AGGREGATION ================= */
    const dealers = await DealerProfile.aggregate([
      { $match: matchStage },
      { $sort: { createdAt: -1 } },
      { $limit: 10 },

      // ✅ Only required fields
      {
        $project: {
          dealer: 1,
          firstName: 1,
          lastName: 1,
          rigvay_id: 1,
          email: 1,
          companyName: 1
        }
      }
    ]);

    return res.status(200).json(
      new ApiResponse(200, "Dealers found", dealers)
    );
  } catch (err) {
    console.error("searchDealers error:", err);
    return res.status(500).json(
      new ApiResponse(500, "Server error", null)
    );
  }
};

/* ---------------------------------------------------
   GET DEALER SUBSCRIPTION (ADMIN VIEW)
--------------------------------------------------- */
module.exports.getDealerSubscription = async (req, res) => {
  try {
    const { dealerId } = req.params; // DealerProfile._id

    const profile = await DealerProfile.findById(dealerId);
    if (!profile) {
      return res.status(404).json(
        new ApiResponse(404, "Dealer profile not found", null)
      );
    }

    const now = new Date();

    const subscription = await Subscription.findOne({
      dealer: profile.dealer,
      active: true,
      endDate: { $gt: now }
    })
      .populate("plan")
      .sort({ endDate: -1 });

    return res.status(200).json(
      new ApiResponse(
        200,
        subscription ? "Subscription found" : "No active subscription",
        subscription
      )
    );
  } catch (err) {
    console.error("getDealerSubscription error:", err);
    return res.status(500).json(
      new ApiResponse(500, "Server error", null)
    );
  }
};

/* ---------------------------------------------------
   GET DEALER ALL SUBSCRIPTIONS (ADMIN HISTORY)
--------------------------------------------------- */
module.exports.getDealerAllSubscriptions = async (req, res) => {
  try {
    const { dealerId } = req.params; // DealerProfile._id

    const profile = await DealerProfile.findById(dealerId);
    if (!profile) {
      return res.status(404).json(
        new ApiResponse(404, "Dealer profile not found", null)
      );
    }

    const subscriptions = await Subscription.find({
      dealer: profile.dealer
    })
      .populate("plan")
      .sort({ createdAt: -1 });

    return res.status(200).json(
      new ApiResponse(200, "All subscriptions fetched", subscriptions)
    );
  } catch (err) {
    console.error("getDealerAllSubscriptions error:", err);
    return res.status(500).json(
      new ApiResponse(500, "Server error", null)
    );
  }
};

/* ---------------------------------------------------
   DEACTIVATE DEALER SUBSCRIPTION (ADMIN)
--------------------------------------------------- */
module.exports.deactivateSubscription = async (req, res) => {
  try {
    const { dealerId } = req.params; // DealerProfile._id

    const profile = await DealerProfile.findById(dealerId);
    if (!profile) {
      return res.status(404).json(
        new ApiResponse(404, "Dealer profile not found", null)
      );
    }

    await Subscription.updateMany(
      { dealer: profile.dealer, active: true },
      { active: false }
    );

    return res.status(200).json(
      new ApiResponse(200, "Subscription deactivated successfully", null)
    );
  } catch (err) {
    console.error("deactivateSubscription error:", err);
    return res.status(500).json(
      new ApiResponse(500, "Server error", null)
    );
  }
};

/* ---------------------------------------------------
   REACTIVATE SUBSCRIPTION (ADMIN)
--------------------------------------------------- */
module.exports.reactivateSubscription = async (req, res) => {
  try {
    const { dealerId, subscriptionId } = req.body;

    if (!dealerId || !subscriptionId) {
      return res.status(400).json(
        new ApiResponse(400, "dealerId and subscriptionId are required", null)
      );
    }

    const profile = await DealerProfile.findById(dealerId);
    if (!profile) {
      return res.status(404).json(
        new ApiResponse(404, "Dealer profile not found", null)
      );
    }

    const subscription = await Subscription.findById(subscriptionId);
    if (!subscription) {
      return res.status(404).json(
        new ApiResponse(404, "Subscription not found", null)
      );
    }

    // 🔒 Prevent reactivating expired subscriptions
    if (subscription.endDate <= new Date()) {
      return res.status(400).json(
        new ApiResponse(400, "Cannot reactivate expired subscription", null)
      );
    }

    // 1️⃣ Deactivate current active
    await Subscription.updateMany(
      { dealer: profile.dealer, active: true },
      { active: false }
    );

    // 2️⃣ Reactivate selected
    subscription.active = true;
    await subscription.save();

    return res.status(200).json(
      new ApiResponse(200, "Subscription reactivated successfully", subscription)
    );
  } catch (err) {
    console.error("reactivateSubscription error:", err);
    return res.status(500).json(
      new ApiResponse(500, "Server error", null)
    );
  }
};
