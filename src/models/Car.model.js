const mongoose = require("mongoose");

const carSchema = new mongoose.Schema(
  {
    dealer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Dealer",
      required: true,
      index: true
    },
    carId: { type: String, unique: true, required: true },
    brand: { type: String, required: true },
    model: { type: String, required: true },
    year: { type: Number, required: true },
    registrationYear: { type: Number },

    price: { type: Number, required: true },
    priceAdditionalText: { type: String },

    type: { type: String },
    body: { type: String },
    fuelType: { type: String },
    transmission: { type: String },

    mileage: { type: Number },
    distance: { type: Number },

    engineInfo: { type: String },
    vin: { type: String },

    ownerType: { type: String },
    ownersCount: { type: Number },

    representative: { type: String },
    businessPartner: { type: String },

    location: { type: String },

    doors: Number,
    interiorColor: String,
    exteriorColor: String,

    description: { type: String, maxlength: 2000 },

    images: {
    type: [String], // Cloudinary URLs
      default: []
    },

    // ✅ FLATTENED STRUCTURE - matches frontend
    interiorEquipment: {
      numberOfSeats: Number,
      parkingSensors: String,
      interiorDesign: String,
      climateControl: String,
      airbags: Number,
      airbagType: String,
      tunerRadio: Boolean,
      bluetooth: Boolean,
      cdPlayer: Boolean,
      mp3Interface: Boolean,
      auxiliaryHeating: Boolean,
      electricHeatedSeats: Boolean,
      electricSideMirror: Boolean,
      electricSeatAdjustment: Boolean,
      startStopSystem: Boolean,
      skiBag: Boolean,
      rainSensor: Boolean,
      powerSteering: Boolean,
      onboardComputer: Boolean,
      navigationSystem: Boolean,
      cruiseControl: Boolean,
      handsFreeKit: Boolean,
      isofix: Boolean,
      electricWindows: Boolean,
      headUpDisplay: Boolean,
      centralLocking: Boolean,
      multifunctionSteeringWheel: Boolean
    },

    exteriorEquipment: {
      sunroof: Boolean,
      roofRack: Boolean,
      panoramicRoof: Boolean,
      metallicExterior: Boolean,
      alloyWheels: Boolean,
      trailerCoupling: Boolean
    },

    environment: {
      fuelConsumption: String,
      emissionSticker: String,
      emissionClass: String,
      roofBars: Boolean,
      esp: Boolean,
      lightSensor: Boolean,
      xenonHeadlights: Boolean,
      immobilizer: Boolean,
      daytimeRunningLights: Boolean,
      adaptiveLighting: Boolean,
      fourWheelDrive: Boolean,
      tractionControl: Boolean,
      particleFilter: Boolean,
      fogLamp: Boolean,
      abs: Boolean
    },

    extras: {
      sportsSuspension: Boolean,
      sportsPackage: Boolean,
      sportsSeats: Boolean
    },

    status: {
      type: String,
      enum: ["live", "review", "sold"],
      default: "review"
    },
    views: { type: Number, default: 0 },
    postedAt: { type: Date, default: Date.now },
    isDeleted: { type: Boolean, default: false }
  },
  { timestamps: true }
);

carSchema.index({ dealer: 1, isDeleted: 1 });
carSchema.index({ status: 1 });
carSchema.index({ carId: 1 });

module.exports = mongoose.model("Car", carSchema);