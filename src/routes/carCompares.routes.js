const express = require("express");
const router = express.Router();

const { compareCars } = require("../controllers/carCompares.controller");

router.post("/compares", compareCars);

module.exports = router;
