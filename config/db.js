const dns = require("dns");
const mongoose = require("mongoose");

// MongoDB Atlas SRV DNS resolution fix
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is not defined");
    }

    console.log("🔄 Connecting to MongoDB Atlas...");

    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 30000,
      connectTimeoutMS: 30000,
    });

    console.log("✅ MongoDB Connected");

    return true;
  } catch (error) {
    console.error("❌ MongoDB Connection Error");
    console.error("Message:", error.message);
    console.error("Name:", error.name);

    throw error;
  }
};

module.exports = connectDB;