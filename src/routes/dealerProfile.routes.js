const express = require("express");
const { body } = require("express-validator");

const router = express.Router();
// const {authMiddleware} = require("../middlewares/auth.middleware");
const { dealerProfile } = require("../controllers/dealerProfile.controller");


router.get('/profile', dealerProfile); 
module.exports = router;