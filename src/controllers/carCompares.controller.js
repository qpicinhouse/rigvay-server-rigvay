const Car = require("../models/Car.model");


//  Fields never needed in comparison

const EXCLUDED_FIELDS = [
  "_id",
  "__v",
  "dealer",
  "createdAt",
  "updatedAt",
  "isDeleted"
];

const flattenObject = (obj, parentKey = "", result = {}) => {
  for (const key in obj) {
    if (EXCLUDED_FIELDS.includes(key)) continue;

    const newKey = parentKey ? `${parentKey}.${key}` : key;
    let value = obj[key];

    // treat false & empty string as null
    if (value === false || value === "") {
      value = null;
    }

    // recurse for nested objects
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      !(value instanceof Date)
    ) {
      flattenObject(value, newKey, result);
    } else {
      result[newKey] = value ?? null;
    }
  }
  return result;
};

// COMPARE CARS CONTROLLER
 
exports.compareCars = async (req, res) => {
  try {
    const { carIds } = req.body;

    // validations
    if (!Array.isArray(carIds) || carIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "carIds array is required"
      });
    }

    if (carIds.length > 3) {
      return res.status(400).json({
        success: false,
        message: "You can compare maximum 3 cars"
      });
    }

    //  fetch cars
    const cars = await Car.find({
      carId: { $in: carIds },
      isDeleted: false
    }).lean();

    // map cars by carId (flattened)
    const carMap = {};
    cars.forEach(car => {
      carMap[car.carId] = flattenObject(car);
    });

    // maintain order (car1, car2, car3)
    const orderedCars = carIds.map(id => carMap[id] || null);

    // collect all fields
    const allFields = new Set();
    orderedCars.forEach(car => {
      if (car) {
        Object.keys(car).forEach(field => allFields.add(field));
      }
    });

    // build comparison
    const comparison = {};
    allFields.forEach(field => {
      comparison[field] = orderedCars.map(car =>
        car ? car[field] ?? null : null
      );
    });

    // REMOVE USELESS FIELDS (all null)
    Object.keys(comparison).forEach(key => {
      if (comparison[key].every(v => v === null)) {
        delete comparison[key];
      }
    });

    return res.status(200).json({
      success: true,
      message: "Cars compared successfully",
      data: { comparison }
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Server error !!"
    });
  }
};
