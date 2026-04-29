const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const generateId = require("./generateUniqueId"); // Using the existing ID generator or a simple suffix

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const uploadToS3 = async (buffer, mimetype, originalname) => {
  try {
    if (!buffer) return null;

    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const key = `uploads/${uniqueSuffix}-${originalname}`; // Adjust folder logic as needed

    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: mimetype,
    });

    await s3Client.send(command);

    // Return the S3 object URL
    const location = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
    
    return {
      secure_url: location,
    };
  } catch (error) {
    console.error("S3 Upload Error:", error);
    return null;
  }
};

module.exports = { uploadToS3 };
