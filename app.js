require("dotenv").config();
const express = require("express");
const app = express();
const fileUpload = require("express-fileupload");
const db = require("./models");
const passport = require("passport");
require("./utils/passport"); 
const cookieParser = require("cookie-parser");
const { Candidate, Job, User } = require("./models");
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

// APP CONFIG 
app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));
app.use(cookieParser());
app.use(passport.initialize());
app.use(methodOverride("_method"));
app.use(express.urlencoded({ extended: true }));

app.use("/api", apiRoutes);


app.use('/', homeRoutes);



//  ROUTES

// Auth routes
app.use("/auth", authRoutes);

// User-specific routes 
app.use("/users", authMiddleware, userRoutes);
app.use("/courses", authMiddleware, courseRoutes);

// Jobs route 
app.use("/jobs", jobRoutes);

// Candidate
app.use("/", candidateRoutes);

// Question & recruiter routes
app.use("/questions", authMiddleware, questionRoutes);
app.use("/recruiter", authMiddleware, recruiterRoutes);

// Take test routes
app.use("/candidate", authMiddleware, takeTestRoutes);

// Profile routes
const profileRoutes = require('./routes/profileRoutes');
app.use('/profile', profileRoutes);



// DATABASE SYNC 
db.sequelize.sync().then(() => {
  app.listen(3000, () =>
    console.log("Server running on http://localhost:3000")
  );
});
