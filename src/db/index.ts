import mongoose from 'mongoose';

const MONGO_URI = "mongodb+srv://pranjalsinghsengar:pranjalsinghsengar@cluster0.yoqhi.mongodb.net/kazaam?retryWrites=true&w=majority&appName=Cluster0"

const connectMongoDB = async (): Promise<void> => {
  try {
    await mongoose.connect(MONGO_URI as string, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    } as mongoose.ConnectOptions);
    console.log('MongoDB connected');
  } catch (error: any) {
    console.error('Database connection failed:', error.message);
    // process.exit(1);
  }
};

export default connectMongoDB;

