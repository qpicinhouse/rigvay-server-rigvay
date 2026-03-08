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
function generateResetToken(dealerId) {
  return jwt.sign(
    { 
      dealerId,
      purpose: 'reset'
    }, 
    JWT_SECRET, 
    { expiresIn: '15m' }
  );
}

function verifyResetToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.purpose === 'reset') {
      return decoded.dealerId;
    }
    return null;
  } catch (err) {
    return null;
  }
}

module.exports = { generateAccessToken, verifyAccessToken, generateResetToken, verifyResetToken };
