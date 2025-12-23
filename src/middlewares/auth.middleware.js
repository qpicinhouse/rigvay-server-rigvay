const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  try {
    let token;

    // 1️⃣ Check Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    // 2️⃣ Check HttpOnly cookie
    if (!token && req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    // 3️⃣ No token found
    if (!token) {
      return res.status(401).json({
        message: "Unauthorized - Token missing"
      });
    }

    // 4️⃣ Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 5️⃣ Attach user info to request
    req.user = decoded; // { id: userId }

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Unauthorized - Invalid or expired token"
    });
  }
};

module.exports = authMiddleware;
