const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");

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
const app = express();

// Global middlewares
app.use(helmet());
app.use(cors({
  origin: [
    "http://localhost:3000",

    "http://43.205.229.172",
    "http://43.205.229.172:3000"
  ],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use(rateLimiter);

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
  console.log("hello");
  res.send("hello Andro How's it going?");
});



// Error handler
app.use(errorHandler);

module.exports = app;
