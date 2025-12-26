const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");

const rateLimiter = require("./middlewares/rateLimiter");
const errorHandler = require("./middlewares/error.middleware");
const authRoutes = require("./routes/auth.routes");
const dealerAuthRoutes = require("./routes/dealerAuthRoutes.routes");

const app = express();

// Global middlewares
app.use(helmet());
app.use(cors({
  origin: "http://localhost:3000",
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use(rateLimiter);

// Routes
app.use("/api/auth", authRoutes);
app.use('/api/auth-dealer', dealerAuthRoutes);


// Error handler
app.use(errorHandler);

module.exports = app;
