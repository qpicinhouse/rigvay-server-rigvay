// middleware/permission.middleware.js

const Admin = require("../models/admin.model");

module.exports.hasPermission = (permission) => async (req, res, next) => {
  try {
    const admin = await Admin.findById(req.admin.id);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    const permissions = admin.permissions || [];

    if (!permissions.includes(permission)) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    next();
  } catch (err) {
    console.log(err);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
