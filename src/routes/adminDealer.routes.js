const express = require("express");
const router = express.Router();
const { param } = require("express-validator");


const controller = require("../controllers/adminDealer.controller");

router.get("/dealers", controller.getAllDealers);
router.get("/dealers-unapproved", controller.getUnapprovedDealers);
router.post("/dealer-approve/:id", [param("id").isMongoId().withMessage("Invalid dealer profile id")],controller.approveDealer);

module.exports = router;