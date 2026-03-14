const express = require("express");
//const multer = require('multer');

const router = express.Router();
const { upload, compressImages } = require("../middlewares/multer.middleware");
const {authMiddleware} = require("../middlewares/auth.middleware");
const { createDealerProfile, getDealerProfile, updateDealerProfile } = require("../controllers/dealerProfile.controller");

// POST /api/dealer/create-profile -> create profile for authenticated dealer
router.post('/create-profile', authMiddleware, upload.fields([
{ name: 'profileImage', maxCount: 1 },
{ name: 'kycDocument', maxCount: 1 }
]), createDealerProfile);

// GET /api/dealer/get-profile  -> fetch profile for authenticated dealer
router.get('/get-profile', authMiddleware, getDealerProfile);

// PUT /api/dealer/update-profile  -> update profile for authenticated dealer
router.put('/update-profile', authMiddleware, upload.fields([
{ name: 'profileImage', maxCount: 1 },
{ name: 'kycDocument', maxCount: 1 }
]), updateDealerProfile);

module.exports = router;