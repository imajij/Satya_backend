import mongoose from "mongoose";

const connectDB = async () => {
  try {
    let mongoURI = process.env.MONGO_URI;
    const defaultDb = process.env.MONGO_DB || 'satya'
    
    if (!mongoURI) {
      throw new Error("MONGO_URI environment variable is not defined");
    }

    // If the URI doesn't include an explicit database path, append the default DB
    // Handle cases with query params: mongodb://host -> mongodb://host/satya
    // mongodb://host/?replicaSet= -> mongodb://host/satya?replicaSet=
    try {
      const hasDbPath = /\/[^\/\?]+/.test(mongoURI.replace(/^mongodb(\+srv)?:\/\//, ''));
      if (!hasDbPath && defaultDb) {
        const idx = mongoURI.indexOf('?')
        if (idx === -1) mongoURI = `${mongoURI.replace(/\/*$/,'')}/${defaultDb}`
        else mongoURI = `${mongoURI.slice(0, idx).replace(/\/*$/,'')}/${defaultDb}${mongoURI.slice(idx)}`
      }
    } catch (e) {
      // fall back to original
    }

    const conn = await mongoose.connect(mongoURI, {
      // Remove deprecated options - mongoose 6+ handles these automatically
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    
    // Log database name
    console.log(`📊 Database: ${conn.connection.name}`);
    
    return conn;
  } catch (error) {
    console.error("❌ MongoDB connection error:", error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
};

// Handle connection events
mongoose.connection.on("connected", () => {
  console.log("🔗 Mongoose connected to MongoDB");
});

mongoose.connection.on("error", (err) => {
  console.error("❌ Mongoose connection error:", err);
});

mongoose.connection.on("disconnected", () => {
  console.log("🔌 Mongoose disconnected");
});

// Graceful shutdown
process.on("SIGINT", async () => {
  await mongoose.connection.close();
  console.log("🛑 MongoDB connection closed through app termination");
  process.exit(0);
});

export default connectDB;