const multer = require("multer");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const tempDir = path.join(__dirname, "..", "public", "temp");
const uploadDir = path.join(__dirname, "..", "public", "uploads");

fs.mkdirSync(tempDir, { recursive: true });
fs.mkdirSync(uploadDir, { recursive: true });

/* ---------------- MULTER STORAGE ---------------- */
const storage = multer.memoryStorage(); // Store files in memory as buffers

const upload = multer({ storage });

/* ---------------- COMPRESS MULTIPLE IMAGES ---------------- */
// const compressImages = async (req, res, next) => {
//   try {
//     if (!req.files || req.files.length === 0) return next();

//     const compressedFiles = [];

//     for (const file of req.files) {
//       const inputPath = file.path;

//       const compressedFilename = "compressed-" + file.filename;
//       const outputPath = path.join(uploadDir, compressedFilename);

//       // Compress image
//       await sharp(inputPath)
//         .resize(1200)
//         .jpeg({ quality: 70 })
//         .toFile(outputPath);

//       // Delete temp file
//       fs.unlinkSync(inputPath);

//       compressedFiles.push({
//         ...file,
//         path: outputPath,
//         filename: compressedFilename,
//       });
//     }

//     // Replace req.files with compressed versions
//     req.files = compressedFiles;

//     next();
//   } catch (error) {
//     console.error("Compression Error:", error);
//     next(error);
//   }
// };

const compressImageFile = async (file) => {
  if (!file.mimetype.startsWith("image/")) return file;
  
  const compressedBuffer = await sharp(file.buffer)
    .resize(1200, undefined, { withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();

  // Only use compressed version if it's actually smaller
  if (compressedBuffer.length >= file.buffer.length) {
    return file; // Original is already well-optimized, keep it as-is
  }

  const parseName = path.parse(file.originalname);
  const newName = parseName.name + ".webp";

  return {
    ...file,
    originalname: newName,
    mimetype: "image/webp",
    buffer: compressedBuffer,
    size: compressedBuffer.length
  };
};

const compressImages = async (req, res, next) => {
  try {
    if (req.file) {
      req.file = await compressImageFile(req.file);
    }
    
    if (req.files) {
      if (Array.isArray(req.files)) {
        const compressedFiles = [];
        for (const file of req.files) {
          compressedFiles.push(await compressImageFile(file));
        }
        req.files = compressedFiles;
      } else {
        const compressedFiles = {};
        for (const fieldName in req.files) {
          compressedFiles[fieldName] = [];
          for (const file of req.files[fieldName]) {
            compressedFiles[fieldName].push(await compressImageFile(file));
          }
        }
        req.files = compressedFiles;
      }
    }

    next();
  } catch (error) {
    console.error("Compression Error:", error);
    next(error);
  }
};

module.exports = {
  upload,
  compressImages,
};