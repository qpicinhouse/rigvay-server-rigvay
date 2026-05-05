const mongoose = require('mongoose');
const axios = require('axios');
const path = require('path');
const dotenv = require('dotenv');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

// Load environment variables
dotenv.config();

// Models
const Car = require('../src/models/Car.model');
const DealerProfile = require('../src/models/dealerProfile.model');
const DealerPage = require('../src/models/dealerPage.model');

const bucketName = (process.env.S3_BUCKET_NAME || "").trim().replace(/"/g, '');
const region = (process.env.AWS_REGION || "").trim().replace(/"/g, '');
const accessKeyId = (process.env.AWS_ACCESS_KEY_ID || "").trim().replace(/"/g, '');
const secretAccessKey = (process.env.AWS_SECRET_ACCESS_KEY || "").trim().replace(/"/g, '');

const s3Client = new S3Client({
  region: region,
  credentials: {
    accessKeyId: accessKeyId,
    secretAccessKey: secretAccessKey,
  },
});

async function uploadBufferToS3(buffer, originalname, mimetype) {
  const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
  const key = `uploads/${uniqueSuffix}-${originalname}`;
  
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: buffer,
    ContentType: mimetype,
  });

  await s3Client.send(command);
  return `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;
}

async function migrateUrl(url) {
  if (!url || !url.includes('cloudinary.com')) return url;

  try {
    console.log(`Migrating: ${url}`);
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data, 'binary');
    const mimetype = response.headers['content-type'];
    const originalname = path.basename(url.split('?')[0]);

    const s3Url = await uploadBufferToS3(buffer, originalname, mimetype);
    console.log(`Successfully migrated to: ${s3Url}`);
    return s3Url;
  } catch (error) {
    console.error(`Failed to migrate ${url}:`, error.message);
    return url; // Keep original if failed
  }
}

async function run() {
  try {
    const mongoUri = process.env.MONGO_URI.trim().replace(/'/g, '');
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // 1. Migrate Car Images
    console.log('Fetching cars...');
    const cars = await Car.find({ images: { $regex: /cloudinary\.com/ } });
    console.log(`Found ${cars.length} cars with Cloudinary images`);
    for (const car of cars) {
      const newImages = [];
      for (const imgUrl of car.images) {
        newImages.push(await migrateUrl(imgUrl));
      }
      car.images = newImages;
      await car.save();
      console.log(`Updated Car ${car.carId}`);
    }

    // 2. Migrate DealerProfile
    console.log('Fetching dealer profiles...');
    const profiles = await DealerProfile.find({
      $or: [
        { profileImageUrl: { $regex: /cloudinary\.com/ } },
        { kycDocument: { $regex: /cloudinary\.com/ } }
      ]
    });
    console.log(`Found ${profiles.length} dealer profiles to migrate`);
    for (const profile of profiles) {
      let updated = false;
      if (profile.profileImageUrl && profile.profileImageUrl.includes('cloudinary.com')) {
        profile.profileImageUrl = await migrateUrl(profile.profileImageUrl);
        updated = true;
      }
      if (profile.kycDocument && profile.kycDocument.includes('cloudinary.com')) {
        profile.kycDocument = await migrateUrl(profile.kycDocument);
        updated = true;
      }
      if (updated) {
        await profile.save();
        console.log(`Updated DealerProfile for ${profile.firstName} ${profile.lastName}`);
      }
    }

    // 3. Migrate DealerPage
    console.log('Fetching dealer pages...');
    const pages = await DealerPage.find({
      $or: [
        { bannerOneUrl: { $regex: /cloudinary\.com/ } },
        { bannerTwoUrl: { $regex: /cloudinary\.com/ } }
      ]
    });
    console.log(`Found ${pages.length} dealer pages to migrate`);
    for (const page of pages) {
      let updated = false;
      if (page.bannerOneUrl && page.bannerOneUrl.includes('cloudinary.com')) {
        page.bannerOneUrl = await migrateUrl(page.bannerOneUrl);
        updated = true;
      }
      if (page.bannerTwoUrl && page.bannerTwoUrl.includes('cloudinary.com')) {
        page.bannerTwoUrl = await migrateUrl(page.bannerTwoUrl);
        updated = true;
      }
      if (updated) {
        await page.save();
        console.log(`Updated DealerPage for dealer ${page.dealer}`);
      }
    }

    console.log('Migration completed!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

run();
