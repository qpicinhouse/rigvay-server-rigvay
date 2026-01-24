const DealerProfile = require("../models/dealerProfile.model");
const Subscription = require("../models/subscription.model");
const Plan = require("../models/Plan.model");
const { ApiResponse } = require("../utils/ApiResponse");

/* ---------------------------------------------------
   GET ALL DEALERS (with current subscription info)
--------------------------------------------------- */
module.exports.getAllDealers = async (req, res) => {
  try {
    const dealers = await DealerProfile.find()
      .populate("dealer", "email phone");

    const now = new Date();

    const enrichedDealers = await Promise.all(
      dealers.map(async (profile) => {
        const subscription = await Subscription.findOne({
          dealer: profile.dealer,
          active: true,
          endDate: { $gt: now }
        }).sort({ endDate: -1 });

        return {
          ...profile.toObject(),
          currentPlan: subscription?.planName || null,
          planExpiry: subscription?.endDate || null
        };
      })
    );

    return res.status(200).json(
      new ApiResponse(200, "All dealers fetched", enrichedDealers)
    );
  } catch (err) {
    console.error("getAllDealers error:", err);
    return res.status(500).json(
      new ApiResponse(500, "Server error", null)
    );
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
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + freePlan.durationMonths);

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
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + plan.durationMonths);

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

    const regex = new RegExp(q.trim(), "i");

    const dealers = await DealerProfile.find({
      $or: [
        { firstName: regex },
        { lastName: regex },
        { rigvay_id: regex },
        { email: regex },
        { companyName: regex }
      ]
    })
      .populate("dealer", "email phone")
      .limit(20);

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
