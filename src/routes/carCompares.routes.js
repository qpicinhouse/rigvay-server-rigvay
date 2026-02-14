const express = require("express");
const router = express.Router();

const { compareCars } = require("../controllers/carCompares.controller");

router.get("/compares", compareCars);

module.exports = router;
