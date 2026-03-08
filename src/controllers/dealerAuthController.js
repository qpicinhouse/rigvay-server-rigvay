const Dealer = require("../models/dealer.model");
const DealerOTP = require("../models/dealerOtp.model");
const { generateOTP, otpExpiry } = require("../utils/otp");
const { sendOTPViaDLT } = require("../utils/dltService");
const { ApiResponse } = require("../utils/ApiResponse");
const { generateAccessToken, generateResetToken, verifyResetToken } = require("../utils/token");
const { hashPassword, comparePassword } = require("../utils/hash");
const DealerProfile = require("../models/dealerProfile.model");
const generateId = require("../utils/generateUniqueId");

module.exports.register = async function register(req, res) {
  try {
    const { email, phone, password } = req.body;
    if (!email || !phone || !password) {
      return res.status(400).json(new ApiResponse(400, "Missing fields", ''));
    }

    const exists = await Dealer.findOne({ $or: [{ email }, { phone }] });
    if (exists) {
      return res.status(409).json(
        new ApiResponse(409, "Email or phone already registered", "")
      );
    }

    const otp = generateOTP();
    const passwordHash = await hashPassword(password);
    const tempDealer = new DealerOTP({email,phone,password: passwordHash,otp,otpExpires: otpExpiry(3)});
    await tempDealer.save();

    await sendOTPViaDLT(phone, otp);

    return res.status(200).json(new ApiResponse(200, "Registration initiated, OTP sent to phone", ''));
  } catch (err) {
    console.error(err);
    return res.status(500).json(new ApiResponse(500, "Server error", ''));
  }
}

module.exports.verifyRegistrationOTP = async function verifyRegistrationOTP(req, res) {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) {
      return res.status(400).json(new ApiResponse(400, "Missing phone or otp", ''));
    }

    const tempDealer = await DealerOTP.findOne({ phone });
    if (!tempDealer) {
      return res.status(404).json( new ApiResponse(404, "Registration not found", ""));
    }

    // If otp or otpExpires missing, or explicitly expired -> remove the unverified registration
    //  if (!dealer.otp || !dealer.otpExpires || new Date() > dealer.otpExpires)
      //
    if (new Date() > tempDealer.otpExpires) {
      await DealerOTP.deleteOne({ _id: tempDealer._id });
      return res.status(400).json(new ApiResponse(400, "OTP expired. Please register again.", ""));
    }

    if (tempDealer.otp !== otp){ 
      return res.status(400).json(new ApiResponse(400,"Invalid OTP.", ''));
    }
    // Move to Dealer collection 
    const dealer = new Dealer({email: tempDealer.email, phone: tempDealer.phone, password: tempDealer.password, rigvay_id: await generateId("dealer")});
    dealer.otp = undefined;
    dealer.otpExpires = undefined;
    await dealer.save();


    // Check if profile exists
    const profile = await DealerProfile.findOne({ dealer: dealer._id });
    const hasProfile = !!profile;

    // Generate token with userType
    const token = generateAccessToken(
      { 
        id: dealer._id, 
        email: dealer.email, 
        phone: dealer.phone ,
        rigvay_id: dealer.rigvay_id
      },
      'dealer' // Add userType here
    );
    await DealerOTP.deleteOne({ _id: tempDealer._id });
    return res.status(200).json(new ApiResponse(200, "Registration successful", {
      token,
      user: {
        id: dealer._id,
        email: dealer.email,
        phone: dealer.phone,
        hasProfile,
        rigvay_id: dealer.rigvay_id
      }
    }));

  } catch (err) {
    console.error(err);
    return res.status(500).json(new ApiResponse(500, "Server error", ''));
  }
}

module.exports.loginWithEmail = async function loginWithEmail(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json(new ApiResponse(400, "Missing email or password", ''));
    }

    const dealer = await Dealer.findOne({ email });
    if (!dealer) {
      return res.status(404).json(new ApiResponse(404, "Invalid credentials", ''));
    }

    const ok = await comparePassword(password, dealer.password);
    if (!ok) {
      return res.status(201).json(new ApiResponse(201, "Invalid credentials", ''));
    }

    // Check if profile exists
    const profile = await DealerProfile.findOne({ dealer: dealer._id });
    const hasProfile = !!profile;

    // Generate token with userType
    const token = generateAccessToken(
      { 
        id: dealer._id, 
        email: dealer.email, 
        phone: dealer.phone,
        rigvay_id: dealer.rigvay_id
      },
      'dealer' // Add userType here
    );

    return res.status(200).json(new ApiResponse(200, "Login successful", {
      token,
      user: {
        id: dealer._id,
        email: dealer.email,
        phone: dealer.phone,
        hasProfile,
        rigvay_id: dealer.rigvay_id
      }
    }));
  } catch (err) {
    console.error(err);
    return res.status(500).json(new ApiResponse(500, "Server error", ''));
  }
}

module.exports.sendLoginOTP = async function sendLoginOTP(req, res) {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(201).json(new ApiResponse(201, "Missing phone", ''));
    }

    const dealer = await Dealer.findOne({ phone });
    if (!dealer) {
      return res.status(204).json(new ApiResponse(204, "Dealer not found", ''));
    }

    const otp = generateOTP();
    dealer.otp = otp;
    dealer.otpExpires = otpExpiry(3);
    await dealer.save();
    await sendOTPViaDLT(phone, otp);

    return res.status(200).json(new ApiResponse(200, "Login OTP sent", ''));
  } catch (err) {
    console.error(err);
    return res.status(500).json(new ApiResponse(500, "Server error", ''));
  }
}

module.exports.verifyLoginOTP = async function verifyLoginOTP(req, res) {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) {
      return res.status(201).json(new ApiResponse(201, "Missing phone or otp", ''));
    }

    const dealer = await Dealer.findOne({ phone });
    if (!dealer) {
      return res.status(204).json(new ApiResponse(204, "Dealer not found", ''));
    }

    if (!dealer.otp || !dealer.otpExpires || new Date() > dealer.otpExpires) {
      dealer.otp = undefined;
      dealer.otpExpires = undefined;
      await dealer.save();
      return res.status(400).json(new ApiResponse(400, "OTP expired or not set", ''));
    }

    if (dealer.otp !== otp) {
      return res.status(400).json(new ApiResponse(400, "Invalid OTP", ''));
    }

    dealer.otp = undefined;
    dealer.otpExpires = undefined;
    await dealer.save();

    // Check if profile exists
    const profile = await DealerProfile.findOne({ dealer: dealer._id });
    const hasProfile = !!profile;

    // Generate token with userType
    const token = generateAccessToken(
      { 
        id: dealer._id, 
        email: dealer.email, 
        phone: dealer.phone,
        rigvay_id: dealer.rigvay_id
      },
      'dealer' // Add userType here
    );

    return res.status(200).json(new ApiResponse(200, "Login successful", {
      token,
      user: {
        id: dealer._id,
        email: dealer.email,
        phone: dealer.phone,
        hasProfile,
        rigvay_id: dealer.rigvay_id
      }
    }));
  } catch (err) {
    console.error(err);
    return res.status(500).json(new ApiResponse(500, "Server error", ''));
  }
}

module.exports.forgotPassword = async function forgotPassword(req, res) {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json(new ApiResponse(400, "Missing phone", ''));
    }

    const dealer = await Dealer.findOne({ phone });
    if (!dealer) {
      return res.status(404).json(new ApiResponse(404, "Phone number not registered", ''));
    }

    const otp = generateOTP();
    dealer.otp = otp;
    dealer.otpExpires = otpExpiry(3);
    await dealer.save();
    await sendOTPViaDLT(phone, otp);

    return res.status(200).json(new ApiResponse(200, "Password reset OTP sent", ''));
  } catch (err) {
    console.error(err);
    return res.status(500).json(new ApiResponse(500, "Server error", ''));
  }
}

module.exports.verifyResetOTP = async function verifyResetOTP(req, res) {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) {
      return res.status(400).json(new ApiResponse(400, "Missing phone or otp", ''));
    }

    const dealer = await Dealer.findOne({ phone });
    if (!dealer) {
      return res.status(404).json(new ApiResponse(404, "Dealer not found", ''));
    }

    if (!dealer.otp || !dealer.otpExpires || new Date() > dealer.otpExpires) {
      dealer.otp = undefined;
      dealer.otpExpires = undefined;
      await dealer.save();
      return res.status(400).json(new ApiResponse(400, "OTP expired or not set", ''));
    }

    if (dealer.otp !== otp) {
      return res.status(400).json(new ApiResponse(400, "Invalid OTP", ''));
    }

    dealer.otp = undefined;
    dealer.otpExpires = undefined;
    await dealer.save();

    const resetToken = generateResetToken(dealer._id);

    return res.status(200).json(new ApiResponse(200, "OTP verified", { resetToken }));
  } catch (err) {
    console.error(err);
    return res.status(500).json(new ApiResponse(500, "Server error", ''));
  }
}

module.exports.resetPassword = async function resetPassword(req, res) {
  try {
    const { resetToken, newPassword, confirmPassword } = req.body;
    if (!resetToken || !newPassword || !confirmPassword) {
      return res.status(400).json(new ApiResponse(400, "Missing fields", ''));
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json(new ApiResponse(400, "Passwords do not match", ''));
    }

    const dealerId = verifyResetToken(resetToken);
    if (!dealerId) {
      return res.status(400).json(new ApiResponse(400, "Invalid or expired reset token", ''));
    }

    const dealer = await Dealer.findById(dealerId);
    if (!dealer) {
      return res.status(404).json(new ApiResponse(404, "Dealer not found", ''));
    }

    const passwordHash = await hashPassword(newPassword);
    dealer.password = passwordHash;
    await dealer.save();

    return res.status(200).json(new ApiResponse(200, "Password reset successful", ''));
  } catch (err) {
    console.error(err);
    return res.status(500).json(new ApiResponse(500, "Server error", ''));
  }
}


