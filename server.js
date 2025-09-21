
const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");

const User = require("./models/User");
const dotenv=require("dotenv");
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public"))); // serve frontend

// Connect to MongoDB
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/careerAdvisorDB";
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log("MongoDB connected"))
  .catch(err => console.error("MongoDB connection error:", err));

app.use('/register',require('./routes/register'));
app.use('/login', require('./routes/auth')); // Example for user auth
app.use('/profile', require('./routes/profile')); // Mount your new profile routes

// Optional: API to list users (for debugging)
app.get("/users", async (req, res) => {
  const users = await User.find().lean();
  res.json(users);
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "home.html"));
});

app.listen(PORT, () => console.log(`Server running: http://localhost:${PORT}`));
