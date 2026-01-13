import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const MONGO_URI = 'mongodb+srv://aqqutedev:aqqutedev@cluster0.qv65ns1.mongodb.net/?appName=Cluster0';

const connectDB = async (): Promise<void> => {
  try {
    const uri = MONGO_URI!;
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000, // 10 seconds timeout
    });
    console.log("✅ MongoDB connected successfully");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error);
    process.exit(1);
  }
};

export default connectDB;
