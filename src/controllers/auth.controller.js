const User = require("../models/user.model");
const { hashPassword } = require("../utils/hash");
const { generateAccessToken } = require("../utils/token");

const register = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const hashed = await hashPassword(password);
    const user = await User.create({ email, password: hashed });

    const token = generateAccessToken({ id: user._id });

    res.status(201).json({ token });
  } catch (error) {
    next(error);
  }
};

module.exports = { register };
