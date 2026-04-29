const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middlewares/auth.middleware");
const { upload, compressImages } = require("../middlewares/multer.middleware");


const {
  getCars,
  addCar,
  updateCar,
  deleteCar,
  getCarsByCarID,
  getCarStats,
  getSingleCarsByCarID,
  markCarAsSold
} = require("../controllers/car.controller");

router.get("/cars", authMiddleware, getCars);
router.get("/cars/statistics", authMiddleware, getCarStats);
router.get("/cars/:carId", authMiddleware, getCarsByCarID);
router.post(
  "/cars",
  authMiddleware,
  upload.array("images", 10),
  compressImages,
  addCar
);

router.put(
  "/cars/:carId",
  authMiddleware,
  upload.array("images", 10),
  compressImages,
  updateCar
);

router.delete("/cars/:carId", authMiddleware, deleteCar);
router.patch("/cars/:carId/mark-sold", authMiddleware, markCarAsSold);

//Public  Routes for get Single Car and
router.get("/cars/v1/:carId", getSingleCarsByCarID);

// Public fast dictionary route
const { getFlatProducers } = require("../controllers/carProducer.controller");
router.get("/producers/flat", getFlatProducers);

module.exports = router;
