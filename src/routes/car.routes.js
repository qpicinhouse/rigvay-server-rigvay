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
  getCarStats
} = require("../controllers/car.controller");

router.get("/cars", authMiddleware, getCars);
router.get("/cars/statistics", authMiddleware, getCarStats);
router.get("/cars/:carId", authMiddleware, getCarsByCarID);
router.post(
  "/cars",
  authMiddleware,
   compressImages,
  upload.array("images", 10),
  addCar
);

router.put(
  "/cars/:carId",
  authMiddleware,
   compressImages,
  upload.array("images", 10),
  updateCar
);

router.delete("/cars/:carId", authMiddleware, deleteCar);

module.exports = router;
