const Car = require("../models/Car.model");
const { ApiResponse } = require("../utils/ApiResponse");
const {carApprovedEmail} = require("../utils/emailTemplates");
const {sendEmail} = require("../utils/sendEmail");
const DealerProfile = require('../models/dealerProfile.model');
//GET ALL CARS
module.exports.getAllCars = async function getAllCars(req, res) {
    try {

        // Pagination params
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

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
                views: 1,
                createdAt: 1
            })
            .populate("dealer", "firstName lastName rigvay_id")
            .sort({ createdAt: -1 })
            .skip(skip)      // ✅ added
            .limit(limit);   // ✅ added

        const totalCars = await Car.countDocuments({ isDeleted: false });

        return res.status(200).json({
            success: true,
            message: "All cars fetched",
            data: cars,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalCars / limit),
                totalCars,
                limit
            }
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

//GET UNAPPROVED CARS

module.exports.getUnapprovedCars = async function getUnapprovedCars(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;

    const filter = {
      isDeleted: false,
      status: "review"
    };

    const totalCars = await Car.countDocuments(filter);

    const cars = await Car.find(filter)
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
        views: 1,
        createdAt: 1
      })
      .populate("dealer", "firstName lastName rigvay_id")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return res.status(200).json({
      success: true,
      message: "Unapproved cars fetched",
      data: cars,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCars / limit),
        totalCars,
        limit
      }
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error.message
    });
  }
};

// APPROVE CAR
module.exports.approveCar = async (req, res) => {
  const { id } = req.params;
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
  const carUrl = `https://rigvay.com/detail/${car._id}`;
  const profile = await DealerProfile.findOne({ dealer: car.dealer });
  if (!profile) {
    console.log("Dealer profile not found");
    return;
  }

  // get dealer details
  const dealerName = `${profile.firstName} ${profile.lastName}`;
  const dealerEmail = profile.email;
  await sendEmail({
    to: dealerEmail,
    subject: "Your Car Listing is Approved",
    html: carApprovedEmail(dealerName, carUrl)
  });
  return res.status(200).json(
    new ApiResponse(200, "Car approved successfully", car)
  );
};

// Reject CAR
module.exports.rejectCar = async (req, res) => {
  const { id } = req.params;
  console.log("carId:", id);

  const car = await Car.findByIdAndUpdate(
    id,
    { status: "review" },
    { new: true }
  );

  if (!car) {
    return res.status(404).json(
      new ApiResponse(404, "Car not found")
    );
  }

  return res.status(200).json(
    new ApiResponse(200, "Car rejected successfully", car)
  );
};

//  Car to sold
module.exports.soldCar = async (req, res) => {
  const { id } = req.params;
  console.log("carId:", id);

  const car = await Car.findByIdAndUpdate(
    id,
    { status: "sold" },  
    { new: true }
  );

  if (!car) {
    return res.status(404).json(
      new ApiResponse(404, "Car not found")
    );
  }

  return res.status(200).json(
    new ApiResponse(200, "Car marked as sold successfully", car)
  );
};

module.exports.deleteCar = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("Delete carId:", id);

    const car = await Car.findByIdAndUpdate(
      id,
      { isDeleted: true },   // ✅ Soft delete
      { new: true }
    );

    if (!car) {
      return res.status(404).json(
        new ApiResponse(404, "Car not found")
      );
    }

    return res.status(200).json(
      new ApiResponse(200, "Car deleted successfully", car)
    );

  } catch (error) {
    return res.status(500).json(
      new ApiResponse(500, "Something went wrong")
    );
  }
};
module.exports.getDealerProfile = async function getDealerProfile(req, res, next) {
  try {
   const { id } = req.params;

    const profile = await DealerProfile.findOne({ dealer: id });
    if (!profile) return res.status(201).json(new ApiResponse(404, 'Dealer profile not found'));
    return res.status(200).json(new ApiResponse(200, 'Profile fetched', { dealer: id, profile: profile,  }));
  } catch (error) {
    next(error);
  }
};

// Get a single car by ID
exports.getCarsByCarID = async (req, res) => {
  try {
    const { carId } = req.params;

    const car = await Car.findOne({
      _id: carId,
      isDeleted: false
    });

    if (!car) {
      return res.status(404).json({
        success: false,
        message: 'Car not found'
      });
    }

    res.json({ success: true, data: car });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

//  Edit car to sold
exports.updateCar = async (req, res) => {
  try {
    console.log("Update request body:", req.body);

    const car = await Car.findOne({
      _id: req.params.carId,
      isDeleted: false
    });
    // dealer: req.user.id,

    if (!car) {
      return res.status(404).json({
        success: false,
        message: "Car not found"
      });
    }

    // Parse stringified JSON fields
    const parsedBody = { ...req.body };

    const jsonFields = [
      'location',
      'interiorEquipment',
      'exteriorEquipment',
      'environment',
      'extras',
      'existingImages'
    ];

    jsonFields.forEach(field => {
      if (parsedBody[field] && typeof parsedBody[field] === 'string') {
        try {
          parsedBody[field] = JSON.parse(parsedBody[field]);
        } catch (e) {
          console.error(`Invalid JSON for ${field}:`, e);
        }
      }
    });
    const existingImages = parsedBody.existingImages;
    delete parsedBody.existingImages;
    // ✅ Direct assignment - no complex mapping needed!
    Object.assign(car, parsedBody);
    let imageUrls = [];

    if (req.files?.length) {
      for (const file of req.files) {
        const uploaded = await uploadOnCloudinary(file.path);
        if (uploaded?.secure_url) {
          imageUrls.push(uploaded.secure_url); // index preserved
        }
      }
    }
    // Handle images
    if (imageUrls.length && Array.isArray(existingImages)) {
      car.images = [...existingImages, ...imageUrls];
    } else if (imageUrls.length) {
      car.images = imageUrls;
    } else if (Array.isArray(existingImages)) {
      car.images = existingImages;
    }

    await car.save();

    res.json({
      success: true,
      message: "Car updated successfully",
      data: car
    });

  } catch (error) {
    console.error("Update car error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};