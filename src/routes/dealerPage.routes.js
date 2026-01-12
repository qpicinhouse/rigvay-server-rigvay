const express = require("express");
//const multer = require('multer');

const router = express.Router();
const upload = require("../middlewares/multer.middleware");
const {authMiddleware} = require("../middlewares/auth.middleware");
const {getPage, updatePage} = require("../controllers/dealerPage.controller");


router.get("/page", authMiddleware, getPage);
router.post("/update-page",authMiddleware,upload.fields([
    { name: "bannerOneUrl", maxCount: 1 },
    { name: "bannerTwoUrl", maxCount: 1 }
  ]),
  updatePage
);

module.exports = router;