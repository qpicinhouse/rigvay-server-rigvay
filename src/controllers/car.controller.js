const Car = require('../models/Car.model');
const Subscription = require('../models/subscription.model');

const buildImages = (files = []) =>
  files.map((file, index) => ({
    url: file.path || file.secure_url,
    isPrimary: index === 0
  }));

exports.getCars = async (req, res) => {
  const cars = await Car.find({
    dealer: req.user.id,
    isDeleted: false
  }).sort({ createdAt: -1 });

  res.json({ success: true, cars });
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

  const car = new Car({
    dealer: dealerId,
    ...req.body,
    images: req.files?.length ? buildImages(req.files) : [],
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

    // ✅ Direct assignment - no complex mapping needed!
    Object.assign(car, parsedBody);

    // Handle images
    if (req.files?.length) {
      const newImages = buildImages(req.files);
      
      if (parsedBody.existingImages && Array.isArray(parsedBody.existingImages)) {
        car.images = [...parsedBody.existingImages, ...newImages];
      } else {
        car.images = newImages;
      }
      
      // Set first image as primary
      car.images.forEach((img, i) => {
        img.isPrimary = (i === 0);
      });
    } else if (parsedBody.existingImages && Array.isArray(parsedBody.existingImages)) {
      car.images = parsedBody.existingImages;
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
