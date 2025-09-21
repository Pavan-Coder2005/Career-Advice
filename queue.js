const { Queue } = require('bullmq');

// This connects to your local Redis instance.
const redisConnection = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: process.env.REDIS_PORT || 6379,
};

// Create and export the queue. We'll use this in the controller and the worker.
const analysisQueue = new Queue('career-analysis', { connection: redisConnection });

module.exports = { analysisQueue };