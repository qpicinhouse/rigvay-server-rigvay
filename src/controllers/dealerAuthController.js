const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Dealer = require("../models/dealer.model");
const { generateOTP, otpExpiry } = require("../utils/otp");
const { sendOTPViaDLT } = require("../utils/dltService");
const { ApiResponse } = require("../utils/ApiResponse");
const { generateAccessToken } = require("../utils/token");
const JWT_SECRET = process.env.JWT_SECRET || 'secrets_secrets';
const JWT_EXPIRES_IN = '7d';

// function generateAccessToken(dealer) {
//   return jwt.sign({ id: dealer._id, email: dealer.email, phone: dealer.phone }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
// }

module.exports.register = async function register(req, res) {
  try {
    const { email, phone, password } = req.body;
    if (!email || !phone || !password) {
      // return res.status(400).json({success: false, message: 'Missing fields' });
      return res.status(400).json(new ApiResponse(400,"Missing fields", ''));
    }

    const existing = await Dealer.findOne({ $or: [{ email }, { phone }] });
    if (existing) {
      return res.status(409).json(new ApiResponse(409,"Email or phone already in use", ''));
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const otp = generateOTP();
    const dealer = new Dealer({ email, phone, password: passwordHash, otp, otpExpires: otpExpiry(5) });
    await dealer.save();
    await sendOTPViaDLT(phone, otp);
    return res.status(200).json(new ApiResponse(200,"Registration initiated, OTP sent to phone", ''));

  } catch (err) {
    console.error(err);
      return res.status(500).json(new ApiResponse(500,"Server error", ''));
  }
}

module.exports.verifyRegistrationOTP = async function verifyRegistrationOTP(req, res) {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) {
      return res.status(400).json(new ApiResponse(400,"Missing phone or otp", ''));
    }
    const dealer = await Dealer.findOne({ phone });
    if (!dealer) return res.status(404).json({ message: 'Dealer not found' });

    // If otp or otpExpires missing, or explicitly expired -> remove the unverified registration
    //  if (!dealer.otp || !dealer.otpExpires || new Date() > dealer.otpExpires)
      //
    if ((dealer.otpExpires && new Date() > dealer.otpExpires)) {
      await Dealer.deleteOne({ _id: dealer._id }).catch(() => {});
      return res.status(400).json(new ApiResponse(400,"OTP expired or not set; registration removed. Please register again.", ''));
    }

    if (dealer.otp !== otp){ 
      return res.status(400).json(new ApiResponse(400,"Invalid OTP.", ''));
    }

    // dealer.isVerified = true;
    dealer.otp = undefined;
    dealer.otpExpires = undefined;
    await dealer.save();

    const token = generateAccessToken({ id: dealer._id, email: dealer.email, phone: dealer.phone });
    return res.status(200).json(new ApiResponse(200,"Registration successful.", token));
  } catch (err) {
    console.error(err);
    return res.status(500).json(new ApiResponse(500,"Server error", ''));
  }
}

module.exports.loginWithEmail = async function loginWithEmail(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json(new ApiResponse(400,"Missing email or password", ''));
    const dealer = await Dealer.findOne({ email });
    if (!dealer) return res.status(404).json(new ApiResponse(404,"Invalid credentials", ''));
    const ok = await bcrypt.compare(password, dealer.password);
    if (!ok) return res.status(401).json(new ApiResponse(401,"Invalid credentials", ''));
    // if (!dealer.isVerified) return res.status(403).json({ message: 'Please verify your account first' });

    const token = generateAccessToken({ id: dealer._id, email: dealer.email, phone: dealer.phone });
    return res.status(200).json(new ApiResponse(200,"Login successful", token));
  } catch (err) {
    console.error(err);
    return res.status(500).json(new ApiResponse(500,"Server error", ''));
  }
}

module.exports.sendLoginOTP = async function sendLoginOTP(req, res) {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json(new ApiResponse(400,"Missing phone", ''));
    const dealer = await Dealer.findOne({ phone });
    if (!dealer) return res.status(404).json(new ApiResponse(404,"Dealer not found", ''));
    // if (!dealer.isVerified) return res.status(403).json({ message: 'Please verify registration first' });

    const otp = generateOTP();
    dealer.otp = otp;
    dealer.otpExpires = otpExpiry(5);
    await dealer.save();
    await sendOTPViaDLT(phone, otp);
    return res.status(200).json(new ApiResponse(200,"Login OTP sent", ''));
  } catch (err) {
    console.error(err);
    return res.status(500).json(new ApiResponse(500,"Server error", ''));
  }
}

module.exports.verifyLoginOTP = async function verifyLoginOTP(req, res) {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) return res.status(400).json(new ApiResponse(400,"Missing phone or otp", ''));

    const dealer = await Dealer.findOne({ phone });
    if (!dealer) return res.status(404).json(new ApiResponse(404,"Dealer not found", ''));
    if (!dealer.otp || !dealer.otpExpires || new Date() > dealer.otpExpires) {
      dealer.otp = undefined;
      dealer.otpExpires = undefined;
      return res.status(400).json(new ApiResponse(400,"OTP expired or not set", ''));
    }
    if (dealer.otp !== otp) return res.status(400).json(new ApiResponse(400,"Invalid OTP", ''));

    dealer.otp = undefined;
    dealer.otpExpires = undefined;
    await dealer.save();

    const token = generateAccessToken({ id: dealer._id, email: dealer.email, phone: dealer.phone });
    return res.status(200).json(new ApiResponse(200,"Login successful", token));
  } catch (err) {
    console.error(err);
    return res.status(500).json(new ApiResponse(500,"Server error", ''));
  }
}
