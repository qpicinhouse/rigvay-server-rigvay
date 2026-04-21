const express = require("express");
const router = express.Router();

const {
  getFilteredDownloadCars
} = require("../controllers/adminCarDownload.controller.js");

// GET API with query params
router.get("/cars/download-filter", getFilteredDownloadCars);

module.exports = router;