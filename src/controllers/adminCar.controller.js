const Car = require("../models/Car.model");
const { ApiResponse } = require("../utils/ApiResponse");
//GET ALL CARS
module.exports.getAllCars = async function getAllCars(req, res) {
    const cars = await Car.find({ isDeleted: false })
        .select({
            dealer: 1,
            brand: 1,
            model: 1,
            year: 1,
            registrationYear: 1,
            price: 1,
            priceAdditionalText: 1,
            type: 1,
            body: 1,
            fuelType: 1,
            transmission: 1,
            distance: 1,
            ownerType: 1,
            location: 1,
            images: 1,
            status: 1,
            createdAt: 1
        })
        .populate("dealer", "firstName lastName rigvay_id")
        .sort({ createdAt: -1 });

    return res.status(200).json(
        new ApiResponse(200, "All cars fetched", cars)
    );
};

//GET UNAPPROVED CARS

module.exports.getUnapprovedCars = async function getUnapprovedCars(req, res) {
    const cars = await Car.find({
        isDeleted: false,
        status: "review"
    })
        .select({
            dealer: 1,
            brand: 1,
            model: 1,
            year: 1,
            registrationYear: 1,
            price: 1,
            priceAdditionalText: 1,
            type: 1,
            body: 1,
            fuelType: 1,
            transmission: 1,
            distance: 1,
            ownerType: 1,
            location: 1,
            images: 1,
            status: 1,
            createdAt: 1
        })
        .populate("dealer", "firstName lastName rigvay_id")
        .sort({ createdAt: -1 });

    return res.status(200).json(
        new ApiResponse(200, "Unapproved cars fetched", cars)
    );
};

// APPROVE CAR
module.exports.approveCar = async (req, res) => {
  const { id } = req.params;
  console.log("carId:", id);

  const car = await Car.findByIdAndUpdate(
    id,
    { status: "live" },
    { new: true }
  );

  if (!car) {
    return res.status(404).json(
      new ApiResponse(404, "Car not found")
    );
  }

  return res.status(200).json(
    new ApiResponse(200, "Car approved successfully", car)
  );
};

