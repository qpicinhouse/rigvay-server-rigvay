const { S3Client, PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
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

const deleteFromS3 = async (fileUrl) => {
  try {
    if (!fileUrl) return;

    // Extract the key from the S3 URL
    const url = new URL(fileUrl);
    const key = decodeURIComponent(url.pathname.slice(1)); // Remove leading "/"

    const command = new DeleteObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);
    console.log(`Deleted from S3: ${key}`);
  } catch (error) {
    console.error("S3 Delete Error:", error);
  }
};

module.exports = { uploadToS3, deleteFromS3 };
