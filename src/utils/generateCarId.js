const Counter = require("../models/counter.model");

async function generateCarId() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const key = `car_${year}_${month}_${day}`;

  const counter = await Counter.findOneAndUpdate(
    { key },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  const number = String(counter.seq).padStart(3, "0");
  return `RIV${year}${month}${day}${number}`;
}

module.exports = generateCarId;
