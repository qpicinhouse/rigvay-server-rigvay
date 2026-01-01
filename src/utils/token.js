const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;

function generateAccessToken(payload, userType) {
  return jwt.sign(
    { 
      ...payload, 
      userType 
    }, 
    JWT_SECRET, 
    { expiresIn: '7d' }
  );
}

function verifyAccessToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

module.exports = { generateAccessToken, verifyAccessToken };
