const User = require("../models/user.model");
const UserOTP = require("../models/userOtp.model");

const { generateOTP, otpExpiry } = require("../utils/otp");
const { sendOTPViaDLT } = require("../utils/dltService");
const { ApiResponse } = require("../utils/ApiResponse");
const { generateAccessToken, generateResetToken, verifyResetToken } = require("../utils/token");
const { hashPassword, comparePassword } = require("../utils/hash");
const generateId = require("../utils/generateUniqueId");

/* ================= REGISTER ================= */
module.exports.sendOtp = async (req, res) => {
  try {
    const { phone, name } = req.body;

    if (!phone) {
      return res.status(400).json(new ApiResponse(400, "Phone required", ""));
    }

    const otp = generateOTP();

    // delete old OTP (important)
    await UserOTP.deleteMany({ phone });

    await UserOTP.create({
      phone,
      name,
      otp,
      otpExpires: otpExpiry(3),
    });

    await sendOTPViaDLT(phone, otp);

    return res.status(200).json(
      new ApiResponse(200, "OTP sent successfully", "")
    );
  } catch (err) {
    console.error(err);
    return res.status(500).json(new ApiResponse(500, "Server error", ""));
  }
};

module.exports.verifyOtp = async (req, res) => {
  try {
    const { phone, otp, name } = req.body;

    if (!phone || !otp) {
      return res.status(400).json(
        new ApiResponse(400, "Phone and OTP required", "")
      );
    }

    const temp = await UserOTP.findOne({ phone });

    if (!temp) {
      return res.status(404).json(
        new ApiResponse(404, "OTP not found", "")
      );
    }

    if (new Date() > temp.otpExpires) {
      await UserOTP.deleteOne({ _id: temp._id });
      return res.status(400).json(
        new ApiResponse(400, "OTP expired", "")
      );
    }

    if (temp.otp !== otp) {
      return res.status(400).json(
        new ApiResponse(400, "Invalid OTP", "")
      );
    }

    // 🔥 CHECK USER EXIST
    let user = await User.findOne({ phone });

    if (!user) {
      // 👉 SIGNUP
      user = await User.create({
        phone,
        name,
        rivuser_id: await generateId("user"),
      });
    } else {
      // 👉 OPTIONAL name update
      if (name && user.name !== name) {
        user.name = name;
        await user.save();
      }
    }

    // LOGIN TOKEN
    const token = generateAccessToken(
      {
        id: user._id,
        phone: user.phone,
        rivuser_id: user.rivuser_id,
      },
      "user"
    );

    await UserOTP.deleteOne({ _id: temp._id });

    return res.status(200).json(
      new ApiResponse(200, "Login successful", {
        token,
        user,
      })
    );
  } catch (err) {
    console.error(err);
    return res.status(500).json(new ApiResponse(500, "Server error", ""));
  }
};
