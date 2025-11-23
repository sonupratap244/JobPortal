require("dotenv").config();
const express = require("express");
const app = express();
const fileUpload = require("express-fileupload");
const db = require("./models");
const passport = require("passport");
require("./utils/passport"); 
const cookieParser = require("cookie-parser");
const methodOverride = require("method-override");
const cors = require("cors");

// Middleware
const { authMiddleware } = require("./middlewares/authMiddleware");

// Routes
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const courseRoutes = require("./routes/courseRoutes");
const jobRoutes = require("./routes/jobRoutes");
const candidateRoutes = require("./routes/candidateRoutes");
const questionRoutes = require("./routes/questionRoutes");
const recruiterRoutes = require("./routes/recruiter");
const takeTestRoutes = require("./routes/takeTest");
const homeRoutes = require('./routes/home');
const apiRoutes = require('./routes/apiRoutes');
const profileRoutes = require('./routes/profileRoutes');

// APP CONFIG 
app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));
app.use(cookieParser());
app.use(passport.initialize());
app.use(methodOverride("_method"));

// API Routes
app.use("/api", apiRoutes);

// Main Routes
app.use('/', homeRoutes);
app.use("/auth", authRoutes);
app.use("/users", authMiddleware, userRoutes);
app.use("/courses", authMiddleware, courseRoutes);
app.use("/jobs", jobRoutes);
app.use("/", candidateRoutes);
app.use("/questions", authMiddleware, questionRoutes);
app.use("/recruiter", authMiddleware, recruiterRoutes);
app.use("/candidate", authMiddleware, takeTestRoutes);
app.use('/profile', profileRoutes);

// SERVER + DATABASE
const PORT = process.env.PORT || 3000;

db.sequelize
  .sync()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Database connection error:", err);
  });
