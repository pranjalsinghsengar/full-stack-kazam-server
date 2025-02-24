// server.ts
import express, { Express, Request, Response } from 'express';
import { Server, Socket } from 'socket.io';
import Redis from 'ioredis';
import mongoose, { Schema, Model, Document } from 'mongoose';
import http from 'http';

const app: Express = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer);

// Redis Configuration
const redis = new Redis({
  host: 'redis-12675.c212.ap-south-1-1.ec2.cloud.redislabs.com',
  port: 12675,
  username: 'default',
  password: 'dssYpBnYQrl01GbCGVhVq2e4dYvUrKJB'
});

// MongoDB Configuration
interface ITask extends Document {
  tasks: string[];
  createdAt: Date;
}

const TaskSchema: Schema = new Schema({
  tasks: [String],
  createdAt: { type: Date, default: Date.now }
});

const Task: Model<ITask> = mongoose.model<ITask>('Task', TaskSchema);

await mongoose.connect('mongodb://localhost:27017/todo_db', {
  useNewUrlParser: true,
  useUnifiedTopology: true
} as mongoose.ConnectOptions);

const REDIS_KEY: string = 'FULLSTACK_TASK_PRANJAL';

// Socket.io Connection
io.on('connection', (socket: Socket) => {
  console.log('New client connected');

  socket.on('add', async (task: string) => {
    try {
      let tasks: string[] = await redis.get(REDIS_KEY) as string;
      tasks = tasks ? JSON.parse(tasks) : [];

      tasks.push(task);

      if (tasks.length > 50) {
        await Task.create({ tasks });
        await redis.set(REDIS_KEY, JSON.stringify([]));
        io.emit('tasksUpdated', []);
      } else {
        await redis.set(REDIS_KEY, JSON.stringify(tasks));
        io.emit('tasksUpdated', tasks);
      }
    } catch (error) {
      console.error('Error adding task:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// HTTP Endpoint
app.get('/fetchAllTasks', async (req: Request, res: Response) => {
  try {
    let tasks: string[] = await redis.get(REDIS_KEY) as string;
    tasks = tasks ? JSON.parse(tasks) : [];
    
    if (tasks.length === 0) {
      const mongoTasks = await Task.find().sort({ createdAt: -1 });
      tasks = mongoTasks.length > 0 ? mongoTasks[0].tasks : [];
    }
    
    res.json({ tasks });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching tasks' });
  }
});

const PORT: number = process.env.PORT ? parseInt(process.env.PORT) : 3000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});