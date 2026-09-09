const dns = require("dns");
const mongoose = require("mongoose");

// MongoDB Atlas SRV DNS resolution fix
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
    });

    console.log("✅ MongoDB Connected");

    return true;
  } catch (error) {
    console.error("❌ MongoDB Error:", error.message);
    throw error;
  }
};

module.exports = connectDB;