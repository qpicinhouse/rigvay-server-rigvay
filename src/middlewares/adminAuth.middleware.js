// middleware/adminAuth.middleware.js

const jwt = require("jsonwebtoken");

module.exports.verifyAdminAuth = async function (req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Authorization token missing",
      });
    }

    const token = authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : authHeader;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access",
      });
    }

    req.admin = decoded;

    next();
  } catch (err) {
    console.log(err);

    return res.status(401).json({
      success: false,
      message: "Invalid token",
    });
  }
};
