"use strict";

const path = require("path"); // Required for serving static files
const cors = require("cors");
const express = require("express");
const morgan = require("morgan");
const db = require("./db");
const { NotFoundError } = require("./expressError");

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const applicationRoutes = require("./routes/applications");
const interviewRoutes = require("./routes/interviews");
const reminderRoutes = require("./routes/reminders");
const oauthRouter = require("./routes/oauthRouter");
const googleCalendarRoutes = require("./routes/googleCalendarRoutes");
const { authorize, listEvents } = require('./helpers/googleCalendarHelper');

const healthRoutes = require("./routes/health");

const { authenticateJWT } = require("./middleware/auth");

const app = express();

authorize()
  .then(listEvents)
  .catch(console.error);

//CORS setup
const allowedOrigins = [
  "http://localhost:3000", // Local frontend during development
  "https://jobjotter.onrender.com", // Production URL
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Authorization", "Content-Type", "Accept"], // Allow required headers
};

// Connect to the database
if (process.env.NODE_ENV !== "test") {
  db.connect()
  .catch(err => console.error("Database connection error:", err.stack));
}


// Middleware
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(express.json());
app.use(morgan("tiny"));
app.use((req, res, next) => {
  if (req.path !== "/auth/token") {
    return authenticateJWT(req, res, next);
  }
  next();
});

// Routes
app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/", oauthRouter);
app.use("/google-calendar", googleCalendarRoutes);
app.use("/applications", applicationRoutes);
app.use("/interviews", interviewRoutes);
app.use("/reminders", reminderRoutes);

app.use("/health", healthRoutes);

app.get("/", (req, res) => {
  res.send("Welcome to Job Jotter API!");
});

// 404 Handler
app.use(function (req, res, next) {
  return next(new NotFoundError());
});

// General Error Handler
app.use(function (err, req, res, next) {
  if (process.env.NODE_ENV !== "test") console.error(err.stack);
  const status = err.status || 500;
  const message = err.message;
  return res.status(status).json({ error: { message, status } });
});

module.exports = app;
