import mongoose from 'mongoose';
import dotenv from "dotenv";


dotenv.config();

// const MONGO_URI = "mongodb+srv://pranjalsinghsengar:pranjalsinghsengar@cluster0.yoqhi.mongodb.net/kazaam?retryWrites=true&w=majority&appName=Cluster0"
const connectMongoDB = async (): Promise<void> => {
  try {
    await mongoose.connect(process.env.MongoDB_DB_URL as string, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      dbName: process.env.MongoDB_Database
    } as mongoose.ConnectOptions);
    console.log('MongoDB connected successfully');
  } catch (error: any) {
    console.error('Database connection failed:', error.message);
  }
};

export default connectMongoDB;

