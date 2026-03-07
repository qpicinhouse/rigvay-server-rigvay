const express = require("express");
const router = express.Router();
const { registerAdmin, sendLoginOTP, verifyLoginOTP } = require("../controllers/adminAuth.controller");
const carProducerController = require("../controllers/carProducer.controller");

router.post('/register-admin', registerAdmin);
router.post('/send-login-otp', sendLoginOTP);
router.post('/verify-login-otp', verifyLoginOTP);

// Admin Routes for Car Producers
router.get("/producers", carProducerController.getAllProducers);
router.post("/producers", carProducerController.createProducer);
router.put("/producers/:id/models", carProducerController.updateProducerModels);
router.put("/producers/:id/rename", carProducerController.renameProducer);
router.delete("/producers/:id", carProducerController.deleteProducer);

module.exports = router;