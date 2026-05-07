const Car = require('../models/Car.model');
const Subscription = require('../models/subscription.model');
const { uploadToS3, deleteFromS3 } = require("../utils/s3");
const generateId = require("../utils/generateUniqueId");
const DealerProfile = require('../models/dealerProfile.model');
const Dealer = require('../models/dealer.model');


const buildImages = (files = []) =>
  files.map((file, index) => ({
    url: file.path || file.secure_url,
    isPrimary: index === 0
  }));

exports.getCars = async (req, res) => {
  const userLat = req.headers['x-user-latitude'];
  const userLng = req.headers['x-user-longitude'];
  console.log("userLat", userLat, "userLng", userLng);
  const page = parseInt(req.query.page) || 1;
  const limit = 2;
  const skip = (page - 1) * limit;

  const baseQuery = {
    dealer: req.user.id,
    isDeleted: false,
  };

  const totalCars = await Car.countDocuments(baseQuery);
  const totalPages = Math.ceil(totalCars / limit);
  const remainingPages = totalPages - page;

  const cars = await Car.find(baseQuery)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  res.json({
    success: true,
    cars,
    page,
    totalPages,
    remainingPages,
    hasMore: page < totalPages,
  });
};
exports.getCarStats = async (req, res) => {
  try {
    const dealerId = req.user.id;
    // console.log('Dealer ID:', dealerId);

    // Base query - works with both ObjectId and string
    const baseQuery = {
      dealer: dealerId,
      isDeleted: false
    };

    // Count cars by status using simple queries
    const [total, live, review, sold] = await Promise.all([
      Car.countDocuments(baseQuery),
      Car.countDocuments({ ...baseQuery, status: 'live' }),
      Car.countDocuments({ ...baseQuery, status: 'review' }),
      Car.countDocuments({ ...baseQuery, status: 'sold' })
    ]);

    // console.log('Stats:', { total, live, review, sold });

    res.json({
      success: true,
      stats: { total, live, review, sold }
    });

  } catch (error) {
    console.error("Car stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch car stats",
      error: error.message
    });
  }
};


exports.getCarsByCarID = async (req, res) => {
  try {
    const { carId } = req.params;

    const car = await Car.findOne({
      _id: carId,
      dealer: req.user.id,
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


exports.addCar = async (req, res) => {
  const dealerId = req.user.id;

  const subscription = await Subscription.findOne({
    dealer: dealerId,
    active: true,
    endDate: { $gte: new Date() }
  });

  if (!subscription)
    return res.status(403).json({ success: false, message: "No active subscription" });

  if (!subscription.unlimited) {
    const count = await Car.countDocuments({ dealer: dealerId, isDeleted: false });
    if (count >= subscription.carLimit)
      return res.status(403).json({ success: false, message: "Car limit reached" });
  }
  let imageUrls = [];

  if (req.files && req.files.length > 0) {
    for (const file of req.files) {
      const uploaded = await uploadToS3(file.buffer, file.mimetype, file.originalname);
      if (uploaded?.secure_url) {
        imageUrls.push(uploaded.secure_url);
      }
    }
  }
  const carId = await generateId("car");
  const car = new Car({
    carId,
    dealer: dealerId,
    ...req.body,
    images: imageUrls,
    status: "review"
  });

  await car.save();
  res.status(201).json({ success: true, car });
};

exports.updateCar = async (req, res) => {
  try {
    console.log("Update request body:", req.body);

    const car = await Car.findOne({
      _id: req.params.carId,
      dealer: req.user.id,
      isDeleted: false
    });

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
        const uploaded = await uploadToS3(file.buffer, file.mimetype, file.originalname);
        if (uploaded?.secure_url) {
          imageUrls.push(uploaded.secure_url); // index preserved
        }
      }
    }
    // Detect removed images and delete them from S3
    const oldImages = car.images || [];
    const keptImages = Array.isArray(existingImages) ? existingImages : [];
    const removedImages = oldImages.filter(url => !keptImages.includes(url));

    // Delete removed images from S3 in parallel (non-blocking)
    if (removedImages.length > 0) {
      await Promise.all(removedImages.map(url => deleteFromS3(url)));
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


exports.markCarAsSold = async (req, res) => {
  try {
    const car = await Car.findOne({
      _id: req.params.carId,
      dealer: req.user.id,
      isDeleted: false
    });

    if (!car) {
      return res.status(404).json({
        success: false,
        message: "Car not found"
      });
    }

    car.status = "sold";
    await car.save();

    res.json({
      success: true,
      message: "Car marked as sold"
    });
  } catch (error) {
    console.error("Mark car as sold error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

exports.deleteCar = async (req, res) => {
  const car = await Car.findOne({
    _id: req.params.carId,
    dealer: req.user.id
  });

  if (!car)
    return res.status(404).json({ success: false });

  car.isDeleted = true;
  await car.save();

  res.json({ success: true });
};


//Public Controller to get Single Car by ID
exports.getSingleCarsByCarID = async (req, res) => {
  try {
    const { carId } = req.params;
    const userLat = req.headers['x-user-latitude'];
    const userLng = req.headers['x-user-longitude'];
    console.log("userLat", userLat, "userLng", userLng);
    // Support matching by String carId (e.g. RIVCAR...) or Mongoose ObjectId
    const query = { isDeleted: false };
    if (/^[0-9a-fA-F]{24}$/.test(carId)) {
      query.$or = [{ _id: carId }, { carId }];
    } else {
      query.carId = carId;
    }

    const car = await Car.findOne(query);

    if (!car) {
      return res.status(404).json({
        success: false,
        message: "Car not found",
      });
    }

    const dealer_id = car.dealer;

    const dealerProfile = await DealerProfile.findOne({ dealer: dealer_id });
    const dealerData = await Dealer.findById(dealer_id).select("rigvay_id");
    const rigvay_id = dealerData?.rigvay_id || null;
    const dealerCars = await Car.find({
      dealer: dealer_id,
      isDeleted: false,
      _id: { $ne: car._id },
    }).sort({ createdAt: -1 });
    res.json({
      success: true,
      message: "Car retrieved successfully",
      data: {
        car,
        rigvay_id,
        dealerProfile,
        dealerCars,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


// INCREASE VIEW COUNT
// =========================================
exports.increaseCarViewCount = async (req, res) => {
  try {

    const { carId } = req.params;

    let car;
    // FIRST FIND USING CUSTOM carId
    car = await Car.findOneAndUpdate(
      { carId: carId },
      {
        $inc: {
          views: 1,
        },
      },
      {
        new: true,
      }
    );
    // =========================================
    if (!car) {

      car = await Car.findByIdAndUpdate(
        carId,
        {
          $inc: {
            views: 1,
          },
        },
        {
          new: true,
        }
      );

    }
    // IF STILL NOT FOUND
    if (!car) {
      return res.status(404).json({
        success: false,
        message: "Car not found",
      });

    }
    res.status(200).json({
      success: true,
      message: "View count updated",
      totalViews: car.views,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};