"use strict";

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const { NotFoundError } = require("./expressError");

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const applicationRoutes = require("./routes/applications");
const interviewRoutes = require("./routes/interviews");
const reminderRoutes = require("./routes/reminders");

const { authenticateJWT } = require("./middleware/auth");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan("tiny"));
app.use(authenticateJWT);

// Routes
app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/applications", applicationRoutes);
app.use("/interviews", interviewRoutes);
app.use("/reminders", reminderRoutes);

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
