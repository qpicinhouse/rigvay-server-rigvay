const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const CarProducer = require("../src/models/CarProducer.model");

const MONGO_URI = process.env.MONGO_URI;

const seedProducers = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to DB...");

    const file = path.join(__dirname, "../../client/src/data/carproducers.json");
    const data = JSON.parse(fs.readFileSync(file, "utf8"));

    for (const brand of data) {
      if (!brand.name) continue;
      
      const models = [];
      if (Array.isArray(brand.childs)) {
        brand.childs.forEach(c => {
          if (c.name) models.push(c.name.trim());
        });
      }

      await CarProducer.findOneAndUpdate(
        { name: brand.name.trim() },
        { $set: { models } },
        { upsert: true, new: true }
      );
      
      console.log(`Saved brand: ${brand.name.trim()} with ${models.length} models.`);
    }

    console.log("Seeding complete.");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding:", error);
    process.exit(1);
  }
};

seedProducers();
