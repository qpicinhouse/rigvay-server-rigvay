const express = require("express");
const router = express.Router();
const { param } = require("express-validator");


const {getAllDealers , getUnapprovedDealers, approveDealer } = require("../controllers/adminDealer.controller");

router.get("/dealers", getAllDealers);
router.get("/dealers-unapproved", getUnapprovedDealers);
router.post("/dealer-approve/:id", [param("id").isMongoId().withMessage("Invalid dealer profile id")],approveDealer);
module.exports = router;