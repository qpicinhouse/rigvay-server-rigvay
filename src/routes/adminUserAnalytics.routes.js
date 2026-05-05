// routes/admin.js

const express = require("express");
const router = express.Router();

const { getLeadAnalytics } = require("../controllers/adminUserleadAnalytics.controller");

// 🔐 add auth middleware if needed
router.get("/lead-analytics", getLeadAnalytics);
module.exports = router;