const { Worker } = require('bullmq');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const User = require('./models/User');
const { getCareerAnalysis } = require('./services/aiAnalysisService');

const redisConnection = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: process.env.REDIS_PORT || 6379,
};

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ Worker connected to MongoDB.');
    
    const worker = new Worker(
      'career-analysis',
      async (job) => {
        // ... your job processing logic remains exactly the same ...
        console.log(`Processing job ${job.id} for user ${job.data.userId}, attempt #${job.attemptsMade + 1}`);
        const user = await User.findById(job.data.userId);
        if (!user || !user.profile) throw new Error('User or profile not found');
        const aiGeneratedResults = await getCareerAnalysis(user.profile, user.profile.resume);
        user.profile.aiAnalysis = aiGeneratedResults;
        user.profile.resume = undefined;
        await user.save();
        console.log(`✅ Successfully completed job ${job.id} for user ${job.data.userId}`);
      },
      { 
        connection: redisConnection,
        // --- ADD THESE NEW SETTINGS ---
        // This tells the worker to slow down and only process a max of 15 jobs per minute.
        limiter: {
          max: 15,
          duration: 60000, // 60 seconds
        },
        // This configures the smart retries
        attempts: 5, // Try a failed job up to 5 times
        backoff: {
          type: 'exponential',
          delay: 60000, // Wait 1 minute before the first retry (60,000 ms)
        },
      }
    );
    
    console.log('🚀 Background worker started and waiting for jobs...');

    worker.on('failed', (job, err) => {
      console.log(`Job ${job.id} failed with error: ${err.message}. Will retry if attempts remain.`);
    });
    
  })
  .catch((err) => console.error('❌ Worker MongoDB connection error:', err));