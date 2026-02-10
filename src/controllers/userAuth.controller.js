const User = require("../models/user.model");
const UserOTP = require("../models/userOtp.model");

const { generateOTP, otpExpiry } = require("../utils/otp");
const { sendOTPViaDLT } = require("../utils/dltService");
const { ApiResponse } = require("../utils/ApiResponse");
const { generateAccessToken } = require("../utils/token");
const { hashPassword, comparePassword } = require("../utils/hash");
const generateId = require("../utils/generateUniqueId");

/* ================= REGISTER ================= */
module.exports.register = async (req, res) => {
  try {
    const { email, phone, password } = req.body;
    if (!email || !phone || !password) {
      return res.status(400).json(new ApiResponse(400, "Missing fields", ""));
    }

    const exists = await User.findOne({ $or: [{ email }, { phone }] });
    if (exists) {
      return res.status(409).json(new ApiResponse(409, "Already registered", ""));
    }

    const otp = generateOTP();
    const passwordHash = await hashPassword(password);

    await UserOTP.create({
      email,
      phone,
      password: passwordHash,
      otp,
      otpExpires: otpExpiry(3)
    });

    await sendOTPViaDLT(phone, otp);

    return res.status(200).json(
      new ApiResponse(200, "Registration OTP sent", "")
    );
  } catch (err) {
    console.error(err);
    res.status(500).json(new ApiResponse(500, "Server error", ""));
  }
};

/* ================= VERIFY REGISTER OTP ================= */
module.exports.verifyRegistrationOTP = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    const tempUser = await UserOTP.findOne({ phone });
    if (!tempUser) {
      return res.status(404).json(new ApiResponse(404, "Not found", ""));
    }

    if (new Date() > tempUser.otpExpires) {
      await UserOTP.deleteOne({ _id: tempUser._id });
      return res.status(400).json(new ApiResponse(400, "OTP expired", ""));
    }

    if (tempUser.otp !== otp) {
      return res.status(400).json(new ApiResponse(400, "Invalid OTP", ""));
    }

    const user = await User.create({
      email: tempUser.email,
      phone: tempUser.phone,
      password: tempUser.password,
      rivuser_id: await generateId("user")
    });

    await UserOTP.deleteOne({ _id: tempUser._id });

    const token = generateAccessToken(
      {
        id: user._id,
        email: user.email,
        phone: user.phone,
        rivuser_id: user.rivuser_id
      },
      "user"
    );

    return res.status(200).json(
      new ApiResponse(200, "Registration successful", {
        token,
        user
      })
    );
  } catch (err) {
    console.error(err);
    res.status(500).json(new ApiResponse(500, "Server error", ""));
  }
};

/* ================= LOGIN WITH PASSWORD ================= */
module.exports.loginWithEmail = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json(new ApiResponse(404, "Invalid credentials", ""));
    }

    const ok = await comparePassword(password, user.password);
    if (!ok) {
      return res.status(400).json(new ApiResponse(400, "Invalid credentials", ""));
    }

    const token = generateAccessToken(
      {
        id: user._id,
        email: user.email,
        phone: user.phone,
        rivuser_id: user.rivuser_id
      },
      "user"
    );

    res.status(200).json(new ApiResponse(200, "Login success", { token, user }));
  } catch (err) {
    console.error(err);
    res.status(500).json(new ApiResponse(500, "Server error", ""));
  }
};

/* ================= SEND LOGIN OTP ================= */
module.exports.sendLoginOTP = async (req, res) => {
  try {
    const { phone } = req.body;

    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json(new ApiResponse(404, "User not found", ""));
    }

    const otp = generateOTP();
    user.otp = otp;
    user.otpExpires = otpExpiry(3);
    await user.save();

    await sendOTPViaDLT(phone, otp);

    res.status(200).json(new ApiResponse(200, "OTP sent", ""));
  } catch (err) {
    console.error(err);
    res.status(500).json(new ApiResponse(500, "Server error", ""));
  }
};

/* ================= VERIFY LOGIN OTP ================= */
module.exports.verifyLoginOTP = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json(new ApiResponse(404, "User not found", ""));
    }

    if (!user.otp || new Date() > user.otpExpires) {
      return res.status(400).json(new ApiResponse(400, "OTP expired", ""));
    }

    if (user.otp !== otp) {
      return res.status(400).json(new ApiResponse(400, "Invalid OTP", ""));
    }

    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    const token = generateAccessToken(
      {
        id: user._id,
        email: user.email,
        phone: user.phone,
        rivuser_id: user.rivuser_id
      },
      "user"
    );

    res.status(200).json(new ApiResponse(200, "Login success", { token, user }));
  } catch (err) {
    console.error(err);
    res.status(500).json(new ApiResponse(500, "Server error", ""));
  }
};
