const express = require("express");
const router = express.Router();
const { param } = require("express-validator");
const { upload, compressImages } = require("../middlewares/multer.middleware");
const { getAllCars,
    getUnapprovedCars,
    approveCar , 
    rejectCar,
    soldCar,
    getDealerProfile,deleteCar, updateCar,getCarsByCarID} = require("../controllers/adminCar.controller");


router.get("/cars", getAllCars);
router.get("/cars-unapproved", getUnapprovedCars);
router.post("/car-approve/:id", approveCar);
router.post("/car-reject/:id", rejectCar);
router.post("/car-sold/:id", soldCar);
router.get("/car-dealer/:id", getDealerProfile);
router.post("/car-deleted/:id", deleteCar);
// router.post("/car-edit/:id", editCar);
router.get("/car-get/:carId", getCarsByCarID);
router.put(
  "/car-edit/:carId",
  upload.array("images", 10),
  compressImages,
  updateCar
);
module.exports = router;