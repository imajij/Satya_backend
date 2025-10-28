import connectDB from "../config/database.js";
import { runSeed } from "./seedData.js";
import mongoose from "mongoose";

const migrate = async () => {
  try {
    console.log("🚀 Starting MongoDB migration...");
    
    // Connect to database
    await connectDB();
    
    // Run migrations/seeding
    await runSeed();
    
    console.log("✅ Migration completed successfully!");
    
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  } finally {
    // Close connection
    await mongoose.connection.close();
    console.log("🔌 Database connection closed");
    process.exit(0);
  }
};

// Run migration if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrate();
}

export default migrate;