const Razorpay = require('razorpay');
const crypto = require('crypto');
const Plan = require('../models/Plan.model');
const Subscription = require('../models/subscription.model');
const Dealer = require('../models/dealer.model');
const DealerProfile = require('../models/dealerProfile.model');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

exports.getPlans = async (req, res) => {
  try {
    const plans = await Plan.find({ active: true }).sort({ amount: 1 });
    res.status(200).json({ success: true, plans });
  } catch (error) {
    console.error('Error fetching plans:', error);
    res.status(500).json({ success: false, message: 'Error fetching plans' });
  }
};

exports.getCurrentSubscription = async (req, res) => {
    try {;
    const dealerId = req.user._id;
    
    const subscription = await Subscription.findOne({
      dealer: dealerId,
      active: true,
      endDate: { $gte: new Date() }
    }).populate('plan');

    res.status(200).json({ success: true, subscription });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    res.status(500).json({ success: false, message: 'Error fetching subscription' });
  }
};

exports.createOrder = async (req, res) => {
  try {
    const { planId } = req.body;
    const dealerId = req.user._id;

    const plan = await Plan.findById(planId);
    if (!plan || !plan.active) {
      return res.status(404).json({ success: false, message: 'Plan not found' });
    }

    const dealerProfile = await DealerProfile.findOne({ dealer: dealerId });
    const dealer = await Dealer.findById(dealerId);

    const options = {
      amount: plan.amount * 100,
      currency: 'INR',
      receipt: `order_${dealerId}_${Date.now()}`,
      notes: {
        dealerId: dealerId.toString(),
        planId: planId.toString(),
        planName: plan.name
      }
    };

    const order = await razorpay.orders.create(options);

    res.status(200).json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      razorpayKeyId: process.env.RAZORPAY_KEY_ID,
      email: dealerProfile?.email || dealer.email,
      phone: dealerProfile?.phone || dealer.phone,
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ success: false, message: 'Error creating order' });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      planId
    } = req.body;

    const dealerId = req.user._id;

    const sign = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest('hex');

    if (razorpay_signature !== expectedSign) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature'
      });
    }

    const plan = await Plan.findById(planId);
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Plan not found' });
    }

    await Subscription.updateMany(
      { dealer: dealerId, active: true },
      { active: false }
    );

    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + plan.durationMonths);

    const subscription = new Subscription({
      dealer: dealerId,
      plan: planId,
      planName: plan.name,
      amount: plan.amount,
      startDate,
      endDate,
      carLimit: plan.carLimit,
      unlimited: plan.unlimited,
      active: true,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      paymentStatus: 'completed'
    });

    await subscription.save();

    res.status(200).json({
      success: true,
      message: 'Subscription activated successfully',
      subscription
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ success: false, message: 'Error verifying payment' });
  }
};

exports.checkCarLimit = async (req, res) => {
  try {
    const dealerId = req.user._id;

    const subscription = await Subscription.findOne({
      dealer: dealerId,
      active: true,
      endDate: { $gte: new Date() }
    });

    if (!subscription) {
      return res.status(403).json({
        success: false,
        message: 'No active subscription found',
        canAddCar: false
      });
    }

    if (subscription.unlimited) {
      return res.status(200).json({
        success: true,
        canAddCar: true,
        unlimited: true
      });
    }

    const Car = require('../models/Car.model');
    const currentCarCount = await Car.countDocuments({ 
      dealer: dealerId,
      isDeleted: { $ne: true }
    });

    const canAddCar = currentCarCount < subscription.carLimit;

    res.status(200).json({
      success: true,
      canAddCar,
      unlimited: false,
      currentCount: currentCarCount,
      limit: subscription.carLimit
    });
  } catch (error) {
    console.error('Error checking car limit:', error);
    res.status(500).json({ success: false, message: 'Error checking car limit' });
  }
};
