const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");

const User = require("./models/User");
const dotenv=require("dotenv");
dotenv.config();

// --- ADDED FOR WORKER ---
// Import the necessary files to run the background worker
const { createWorker } = require('./queue');
const { getCareerAnalysis } = require('./services/aiAnalysisService');
// ----------------------


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

app.listen(PORT, () => {
    console.log(`Server running: http://localhost:${PORT}`);

    // --- WORKER CODE INCLUDED HERE ---
    // After the server starts, this code will start the background worker
    // in the same process to listen for AI analysis jobs from the queue.
    console.log("🚀 Initializing Background Worker...");
    
    createWorker(async (job) => {
        const { userId } = job.data;
        console.log(`Processing AI analysis job for user ${userId}`);
        
        try {
            const user = await User.findById(userId);
            if (!user) {
                throw new Error('User not found for AI analysis.');
            }
            
            // Call the AI service to get the analysis
            const aiGeneratedResults = await getCareerAnalysis(user.profile, user.profile.resumePath);

            // Save the AI's results back to the user's document in the database
            user.profile.aiAnalysis = aiGeneratedResults;
            await user.save();
            
            console.log(`✅ AI Analysis completed and saved for user ${userId}`);
        } catch (error) {
            console.error(`❌ AI Analysis job failed for user ${userId}:`, error);
            // Throw the error so the job queue can retry it if configured
            throw error; 
        }
    });
    
    console.log("✅ Background Worker started and listening for jobs.");
    // ---------------------------------
});

