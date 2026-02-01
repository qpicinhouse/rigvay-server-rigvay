const express = require("express");
//const multer = require('multer');

const router = express.Router();
const { upload, compressImages } = require("../middlewares/multer.middleware");
const {authMiddleware} = require("../middlewares/auth.middleware");
const {getPage, updatePage, getPublicDealerPage} = require("../controllers/dealerPage.controller");
const { Route } = require("express");


router.get("/page", authMiddleware, getPage);
router.post("/update-page",authMiddleware,upload.fields([
    { name: "bannerOneUrl", maxCount: 1 },
    { name: "bannerTwoUrl", maxCount: 1 }
  ]),
  updatePage
);
//GET /api/public/dealer/:rigvay_id?page=1&limit=10

router.get("/dealer/:rigvay_id", getPublicDealerPage);

module.exports = router;