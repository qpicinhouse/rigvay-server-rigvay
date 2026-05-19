const Admin = require("../models/admin.model");
const { ApiResponse } = require("../utils/ApiResponse");
const { generateOTP, otpExpiry } = require("../utils/otp");
const { sendOTPViaDLT } = require("../utils/dltService");
const { generateAccessToken } = require("../utils/token");

// ================= REGISTER ADMIN =================

module.exports.registerAdmin = async function (req, res) {
  try {
    const { phone, permissions } = req.body;

    if (!phone) {
      return res
        .status(400)
        .json(new ApiResponse(400, "Phone number required", ""));
    }

    const existingAdmin = await Admin.findOne({
      phone,
    });

    if (existingAdmin) {
      return res
        .status(409)
        .json(new ApiResponse(409, "Admin already exists", ""));
    }

    const newAdmin = await Admin.create({
      phone,
      permissions: permissions || [],
    });

    return res
      .status(201)
      .json(new ApiResponse(201, "Admin registered successfully", newAdmin));
  } catch (err) {
    console.log(err);

    return res
      .status(500)
      .json(new ApiResponse(500, "Server error", err.message));
  }
};

// ================= SEND LOGIN OTP =================

module.exports.sendLoginOTP = async function (req, res) {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res
        .status(400)
        .json(new ApiResponse(400, "Phone number required", ""));
    }

    const admin = await Admin.findOne({
      phone,
    });

    if (!admin) {
      return res.status(404).json(new ApiResponse(404, "Admin not found", ""));
    }

    const otp = generateOTP();
    admin.otp = otp;
    admin.otpExpires = otpExpiry(3);
    await admin.save();
    await sendOTPViaDLT(phone, otp);
    return res
      .status(200)
      .json(new ApiResponse(200, "OTP sent successfully", ""));
  } catch (err) {
    console.log(err);

    return res
      .status(500)
      .json(new ApiResponse(500, "Server error", err.message));
  }
};

// ================= VERIFY LOGIN OTP =================

module.exports.verifyLoginOTP = async function (req, res) {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res
        .status(400)
        .json(new ApiResponse(400, "Phone and OTP required", ""));
    }

    const admin = await Admin.findOne({
      phone,
    });

    if (!admin) {
      return res.status(404).json(new ApiResponse(404, "Admin not found", ""));
    }

    if (!admin.otp || !admin.otpExpires) {
      return res.status(400).json(new ApiResponse(400, "OTP not found", ""));
    }

    if (new Date() > admin.otpExpires) {
      admin.otp = undefined;

      admin.otpExpires = undefined;

      await admin.save();

      return res.status(400).json(new ApiResponse(400, "OTP expired", ""));
    }

    if (admin.otp !== otp) {
      return res.status(400).json(new ApiResponse(400, "Invalid OTP", ""));
    }

    admin.otp = undefined;

    admin.otpExpires = undefined;

    await admin.save();

    const token = generateAccessToken(
      {
        id: admin._id,
        phone: admin.phone,
        permissions: admin.permissions,
      },
      "admin",
    );

    return res.status(200).json(
      new ApiResponse(200, "Login successful", {
        token,

        admin: {
          id: admin._id,
          phone: admin.phone,
          permissions: admin.permissions,
        },
      }),
    );
  } catch (err) {
    console.log(err);

    return res
      .status(500)
      .json(new ApiResponse(500, "Server error", err.message));
  }
};
