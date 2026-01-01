const { verifyAccessToken } = require("../utils/token");
const { ApiResponse } = require("../utils/ApiResponse");

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json(new ApiResponse(401, "No token provided", ''));
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyAccessToken(token);

    if (!decoded) {
      return res.status(401).json(new ApiResponse(401, "Invalid or expired token", ''));
    }

    // Attach user data to request
    req.user = {
      id: decoded.id,
      email: decoded.email,
      phone: decoded.phone,
      userType: decoded.userType // 'dealer' or 'buyer'
    };

    next();
  } catch (error) {
    return res.status(401).json(new ApiResponse(401, "Authentication failed", ''));
  }
};

// Middleware to check specific user type
const requireUserType = (...allowedTypes) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json(new ApiResponse(401, "Not authenticated", ''));
    }

    if (!allowedTypes.includes(req.user.userType)) {
      return res.status(403).json(new ApiResponse(403, "Access denied. Invalid user type.", ''));
    }

    next();
  };
};

module.exports = { authMiddleware, requireUserType };
