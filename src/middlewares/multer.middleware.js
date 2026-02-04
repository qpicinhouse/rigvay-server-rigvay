const multer = require("multer");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const tempDir = path.join(__dirname, "..", "public", "temp");
const uploadDir = path.join(__dirname, "..", "public", "uploads");

fs.mkdirSync(tempDir, { recursive: true });
fs.mkdirSync(uploadDir, { recursive: true });

/* ---------------- MULTER STORAGE ---------------- */
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, tempDir);
  },

  filename: function (req, file, cb) {
    const uniqueSuffix =
      Date.now() + "-" + Math.round(Math.random() * 1e9);

    const ext = path.extname(file.originalname);

    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});

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

const compressImages = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) return next();

    const compressedFiles = [];

    for (const file of req.files) {
      const inputPath = file.path;

      const compressedFilename = "compressed-" + file.filename;
      const outputPath = path.join(uploadDir, compressedFilename);

      // Compress image
      await sharp(inputPath)
        .resize(1200)
        .jpeg({ quality: 70 })
        .toFile(outputPath);

      // Delete temp file IMMEDIATELY after compression
      try {
        if (fs.existsSync(inputPath)) {
          fs.unlinkSync(inputPath);
          console.log(`Deleted temp file: ${inputPath}`);
        }
      } catch (deleteError) {
        console.error(`Failed to delete temp file: ${inputPath}`, deleteError);
      }

      compressedFiles.push({
        ...file,
        path: outputPath,
        filename: compressedFilename,
      });
    }

    // Replace req.files with compressed versions
    req.files = compressedFiles;

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