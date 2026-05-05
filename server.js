const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const morgan = require("morgan");
const dotenv = require("dotenv");

dotenv.config();

const connectDB = require("./config/db");

connectDB();

const app = express();

const configuredOrigins = [process.env.CLIENT_URLS, process.env.CLIENT_URL]
  .filter(Boolean)
  .flatMap((value) => value.split(","))
  .map((origin) => origin.trim().replace(/\/$/, ""))
  .filter(Boolean);

const localDevOrigins = ["http://localhost:5200", "http://localhost:5173", "http://localhost:3000", "http://localhost:5000"];
const allowedOrigins = Array.from(new Set([...configuredOrigins, ...localDevOrigins]));

// Security headers
app.use(helmet());

// Logging
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// CORS
app.use(
  cors({
    origin: (origin, callback) => {
      const normalizedOrigin = origin ? origin.replace(/\/$/, "") : "";

      if (!origin || allowedOrigins.includes(normalizedOrigin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked for origin ${normalizedOrigin}`));
    },
    credentials: true,
  })
);

// Align with README: limit request body size to 10mb
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));


app.get("/", (req, res) => {
  res.json({ message: "SplitEase API is running" });
});
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/groups', require('./routes/groupRoutes'));
app.use('/api/expenses', require('./routes/expenseRoutes'));
app.use('/api/invite', require('./routes/inviteRoutes'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Simple error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Internal server error" });
});
