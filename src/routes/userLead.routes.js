// routes/leadRoutes.js
const express = require("express");
const router = express.Router();
const {createLead } = require("../controllers/userLead.controller");
const { authMiddleware } = require("../middlewares/auth.middleware");

router.post("/v1/lead", authMiddleware, createLead);

module.exports = router;