const Admin = require("../models/admin.model");
const { ApiResponse } = require("../utils/ApiResponse");
const { generateOTP, otpExpiry } = require("../utils/otp");
const { sendOTPViaDLT } = require("../utils/dltService");
const { generateAccessToken } = require("../utils/token");

module.exports.registerAdmin = async function registerAdmin(req, res) {
    try {
        const { phone } = req.body;
        if (!phone) {
            return res.status(400).json(new ApiResponse(400, "Missing phone Number ", ""));
        }

        const existingAdmin = await Admin.findOne({ phone });
        if (existingAdmin) {
            return res.status(409).json(new ApiResponse(409, "Admin already exists", ""));
        }

        const newAdmin = new Admin({ phone });
        await newAdmin.save();

        return res.status(201).json(new ApiResponse(201, "Admin registered successfully", ""));
    } catch (err) {
        console.error(err);
        return res.status(500).json(new ApiResponse(500, "Server error", ""));
    }
};

module.exports.sendLoginOTP = async function sendLoginOTP(req, res) {
    try {
        const { phone } = req.body;
        if (!phone) {
            return res.status(400).json(new ApiResponse(400, "Missing phone Number ", ""));
        }

        const admin = await Admin.findOne({ phone });
        if (!admin) {
            return res.status(404).json(new ApiResponse(404, "Admin not found !!", ""));
        }

        const otp = generateOTP();
        admin.otp = otp;
        admin.otpExpires = otpExpiry(3);
        await admin.save();
        await sendOTPViaDLT(phone, otp);

        return res.status(200).json(new ApiResponse(200, "Login OTP sent", ""));
    } catch (err) {
        console.error(err);
        return res.status(500).json(new ApiResponse(500, "Server error", ""));
    }
};

module.exports.verifyLoginOTP = async function verifyLoginOTP(req, res) {
    try {
        const { phone, otp } = req.body;
        if (!phone || !otp) {
            return res.status(400).json(new ApiResponse(400, "Missing phone or otp", ''));
        }

        const admin = await Admin.findOne({ phone });
        if (!admin) {
            return res.status(404).json(new ApiResponse(404, "Admin not found", ''));
        }

        if (!admin.otp || !admin.otpExpires || new Date() > admin.otpExpires) {
            admin.otp = undefined;
            admin.otpExpires = undefined;
            await admin.save();
            return res.status(400).json(new ApiResponse(400, "OTP expired or not set", ''));
        }

        if (admin.otp !== otp) {
            return res.status(400).json(new ApiResponse(400, "Invalid OTP", ''));
        }

        admin.otp = undefined;
        admin.otpExpires = undefined;
       

 
        const token = generateAccessToken(
            {
                id: admin._id,
                phone: admin.phone
            },
            'admin' 
        );
         await admin.save();
        return res.status(200).json(new ApiResponse(200, "Login successful", {
            token,
            user: {
                id: admin._id,
                phone: admin.phone,
            }
        }));
    } catch (err) {
        console.error(err);
        return res.status(500).json(new ApiResponse(500, "Server error", ''));
    }
};
