const DealerProfile = require("../models/dealerProfile.model");
const {ApiResponse}= require("../utils/ApiResponse");

exports.getAllDealers = async (req, res, next) => {
  try {
    const dealers = await DealerProfile.find().populate("dealer", "email phone");
    return res.status(200).json(new ApiResponse(200, "All dealers fetched", dealers));
  } catch (err) {
    return res.status(500).json(new ApiResponse(500, "Server error", null));
  }
};

exports.getUnapprovedDealers = async (req, res, next) => {
  try {
    const dealers = await DealerProfile.find({ adminApproved: false }).populate("dealer", "email phone");
    return res.status(200).json(new ApiResponse(200, "Unapproved dealers fetched", dealers));
  } catch (err) {
    return res.status(500).json(new ApiResponse(500, "Server error", null));
  }
};

exports.approveDealer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const profile = await DealerProfile.findById(id);
    if (!profile) return res.status(404).json(new ApiResponse(404, "Dealer profile not found", null));
    if (profile.adminApproved) return res.status(400).json(new ApiResponse(400, "Dealer already approved", null));
    profile.adminApproved = true;
    await profile.save();
    return res.status(200).json(new ApiResponse(200, "Dealer approved", profile));
  } catch (err) {
    return res.status(500).json(new ApiResponse(500, "Internal Server error", null));
  }
};