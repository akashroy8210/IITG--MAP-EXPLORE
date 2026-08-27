const mongoose = require('mongoose');
const dns = require("dns");
dns.setServers(["1.1.1.1","0.0.0.0"])
async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error('MONGO_URI environment variable is not set');
  }

  await mongoose.connect(uri, {
    // Mongoose 7+ uses these defaults, but being explicit for clarity
  });

  console.log(`✅ MongoDB connected: ${mongoose.connection.host}`);

  mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected');
  });
}

module.exports = connectDB;
