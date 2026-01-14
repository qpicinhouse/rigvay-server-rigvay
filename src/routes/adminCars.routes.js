const express = require("express");
const router = express.Router();
const { param } = require("express-validator");
const { getAllCars,
    getUnapprovedCars,
    approveCar } = require("../controllers/adminCar.controller");


router.get("/cars", getAllCars);
router.get("/cars-unapproved", getUnapprovedCars);
router.post("/car-approve/:id", approveCar);
module.exports = router;