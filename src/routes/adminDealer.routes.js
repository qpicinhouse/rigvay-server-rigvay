const express = require("express");
const router = express.Router();

const {
    getAllDealers,
    getUnapprovedDealers,
    approveDealer,
    getAllPlansForAdmin,
    assignPlanToDealer,
    searchDealers,
    getDealerSubscription,
    getDealerAllSubscriptions,
    deactivateSubscription,
    reactivateSubscription,
    rejectDealer,
} = require("../controllers/adminDealer.controller");

/* ---------------------------------------------------
   DEALERS
--------------------------------------------------- */
router.get("/dealers", getAllDealers);
router.get("/dealers-unapproved", getUnapprovedDealers);
router.post("/dealer-approve/:id", approveDealer);
router.post("/dealer-reject/:id", rejectDealer);
router.get("/dealers/search", searchDealers);

/* ---------------------------------------------------
   SUBSCRIPTIONS (ADMIN VIEW)
--------------------------------------------------- */
router.get("/dealers/:dealerId/subscription", getDealerSubscription);
router.get("/dealers/:dealerId/subscriptions/all", getDealerAllSubscriptions);
router.post("/dealers/:dealerId/subscription/deactivate", deactivateSubscription);
router.post("/subscription/reactivate", reactivateSubscription);

/* ---------------------------------------------------
   PLANS (ADMIN)
--------------------------------------------------- */
router.get("/plans", getAllPlansForAdmin);
router.post("/assign-plan", assignPlanToDealer);

module.exports = router;
