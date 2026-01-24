const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser"); 

const rateLimiter = require("./middlewares/rateLimiter");
const errorHandler = require("./middlewares/error.middleware");
const authRoutes = require("./routes/auth.routes");
const dealerAuthRoutes = require("./routes/dealerAuthRoutes.routes");
const dealerProfileRoutes = require("./routes/dealerProfile.routes");
const subscriptionRoutes = require("./routes/subscription.routes");
const carRoutes = require("./routes/car.routes");
const adminRoutes = require("./routes/admin.routes");
const adminDealerRoutes = require("./routes/adminDealer.routes");
const dealerPageRoutes = require("./routes/dealerPage.routes");
const adminCarsRoutes = require("./routes/adminCars.routes");
const searchPageRoutes = require("./routes/searchPage.routes");

const { razorpayWebhook } = require("./controllers/razorpayWebhook.controller"); 

const app = express();

// Global middlewares
app.use(helmet());
app.use(cors({
  origin: [
    "http://43.205.229.172",
    "http://localhost:5173",
    'http://localhost:3000',
    'http://localhost:3001',
    "https://rigvay.com"
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.post(
  "/api/razorpay/webhook",
  bodyParser.raw({ type: "application/json" }),
  razorpayWebhook
);

// Normal body parsing AFTER webhook
app.use(express.json());
app.use(cookieParser());
// app.use(rateLimiter);

// Routes
app.use("/api/auth", authRoutes);
app.use('/api/auth-dealer', dealerAuthRoutes);
app.use('/api/dealer', dealerProfileRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/dealer', carRoutes);
app.use('/api/dealer', dealerPageRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin', adminDealerRoutes);
app.use('/api/admin', adminCarsRoutes);
app.use('/api/cars/', searchPageRoutes);

app.get('/home', (req, res) => {
  res.send("hello Andro How's it going?");
});

app.get('/api/home', (req, res) => {
  res.send("hello Andro How's it in real life?");
});

// Error handler
app.use(errorHandler);

module.exports = app;
