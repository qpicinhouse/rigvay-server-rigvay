const crypto = require("crypto");
const Subscription = require("../models/subscription.model");

exports.razorpayWebhook = async (req, res) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    const signature = req.headers["x-razorpay-signature"];
    const body = req.body.toString(); // RAW BODY

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(body)
      .digest("hex");

    if (signature !== expectedSignature) {
      console.error("❌ Invalid webhook signature");
      return res.status(400).json({ success: false });
    }

    const event = JSON.parse(body);

    const payload = event.payload?.payment?.entity;
    const orderId = payload?.order_id;
    const paymentId = payload?.id;
    const status = payload?.status;

    if (!orderId) return res.json({ success: true });

    const subscription = await Subscription.findOne({
      razorpayOrderId: orderId
    });

    if (!subscription) return res.json({ success: true });

    if (status === "captured") {
      subscription.paymentStatus = "completed";
      subscription.active = true;
      subscription.razorpayPaymentId = paymentId;
      await subscription.save();
    }

    if (status === "failed") {
      subscription.paymentStatus = "failed";
      subscription.active = false;
      await subscription.save();
    }

    return res.json({ success: true });
  } catch (err) {
    console.error("Webhook error:", err);
    return res.status(500).json({ success: false });
  }
};
