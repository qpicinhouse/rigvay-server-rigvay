const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middlewares/auth.middleware");
const {
  getPlans,
  getCurrentSubscription,
  createOrder,
  verifyPayment,
  checkCarLimit
} = require("../controllers/subscription.controller");

router.get('/plans', getPlans);
router.get('/current', authMiddleware, getCurrentSubscription);
router.post('/create-order', authMiddleware, createOrder);
router.post('/verify-payment', authMiddleware, verifyPayment);
router.get('/check-car-limit', authMiddleware, checkCarLimit);

module.exports = router;