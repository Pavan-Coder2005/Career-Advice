const { Queue, Worker } = require('bullmq');
const IORedis = require('ioredis');

// This is the critical fix. It tells IORedis to use the full Render Redis URL
// when the environment variable is available. If process.env.REDIS_URL is not set
// (like on your local machine), it will automatically fall back to the default 'localhost:6379'.
const connection = new IORedis(process.env.REDIS_URL, {
    // This option is required for BullMQ to work correctly on Render.
    maxRetriesPerRequest: null 
});

// Create and export the queue.
const analysisQueue = new Queue('career-analysis', { connection });

// A helper function to create a worker. This prevents you from having to
// duplicate the connection logic in your worker.js file.
const createWorker = (processFn) => {
    return new Worker('career-analysis', processFn, { connection });
};

module.exports = {
    analysisQueue,
    createWorker,
};