const mongoose = require('mongoose');

let isConnecting = false;
let retryTimer = null;

const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    console.warn('MONGO_URI is not defined; starting API without MongoDB connection');
    return;
  }

  if (mongoose.connection.readyState === 1 || isConnecting) {
    return;
  }

  isConnecting = true;
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000, // 5s connection timeout for faster recovery
    });

    if (retryTimer) {
      clearInterval(retryTimer);
      retryTimer = null;
    }

    // Enable verbose Mongoose query logs only when explicitly requested
    const mongoDebug = (process.env.MONGO_DEBUG || 'false').toLowerCase() === 'true';
    mongoose.set('debug', mongoDebug);

    console.log('MongoDB connected successfully');
  } catch (err) {
    console.error('MongoDB connection error: Could not connect to any servers in your MongoDB Atlas cluster.');
    console.error('👉 ACTION REQUIRED: Your current IP address is not whitelisted in MongoDB Atlas.');
    console.error('👉 Please visit https://cloud.mongodb.com -> Network Access -> Add Current IP Address (or 0.0.0.0/0).');

    // Automatically attempt background reconnection every 10 seconds so the server recovers as soon as the IP is whitelisted
    if (!retryTimer) {
      retryTimer = setInterval(async () => {
        if (mongoose.connection.readyState !== 1) {
          try {
            await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
            console.log('MongoDB connected successfully on auto-retry!');
            clearInterval(retryTimer);
            retryTimer = null;
          } catch (_) {
            // Silently continue waiting for Atlas IP whitelist update
          }
        } else {
          clearInterval(retryTimer);
          retryTimer = null;
        }
      }, 10000);
    }
    throw err;
  } finally {
    isConnecting = false;
  }
};

module.exports = connectDB;
