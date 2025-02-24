import express, { Request, Response } from "express";
import dotenv from "dotenv";
import cors from "cors";
import { createServer } from "http";
import { Server, Socket } from "socket.io";
import { createClient } from "redis";
import mongoose from "mongoose";
import Todo,{ITodo} from "./models/todo";
import TodoRoutes from "./routes";
import connectMongoDB from "./db";

const app = express();
dotenv.config();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
  },
});

export const redisClient = createClient({
  url: "redis://localhost:6379",
});
export const REDIS_KEY = "FULLSTACK_TASK_PRANJAL";

// MongooseConnect()
const PORT = process.env.PORT || 8080;

app.use(express.json());
app.use(cors());

io.on("connection", async (socket: Socket) => {
  console.log("new client connected", socket.id);

  socket.on("add", async (task: string) => {
    try {
      // Ensure task is a string
      // if (typeof task !== "string") {
      //   throw new Error("Task must be a string");
      // }

      // Get current tasks from Redis
      const cachedTasks = await redisClient.get(REDIS_KEY);
      let tasks: string[] = cachedTasks ? JSON.parse(cachedTasks) : [];

      // Add new task (string)
      tasks.push(task);

      // Check if we've exceeded 50 items
      if (tasks.length > 10) {
        console.log("Cache exceeded 50 items, moving to MongoDB...");

        // Move all tasks to MongoDB
        const tasksToSave = tasks.map(t => ({
          
          task: t, // t is already a string
          createdAt: new Date()
        }));
        console.log("tasks",tasks)

        await Todo.insertMany(tasks)
          .then(() => console.log("Successfully moved tasks to MongoDB"))
          .catch(err => {
            throw new Error(`MongoDB insert failed: ${err.message}`);
          });

        // Flush the Redis cache
        tasks = [];
        await redisClient.set(REDIS_KEY, JSON.stringify(tasks))
          .then(() => console.log("Redis cache flushed"))
          .catch(err => {
            throw new Error(`Redis flush failed: ${err.message}`);
          });

        // Get all tasks from MongoDB to send to clients
        const mongoTasks = await Todo.find().lean();
        const allTasks = mongoTasks.map((t: ITodo) => t.task);
        io.emit("taskListUpdate", allTasks);
      } else {
        // If under 50 items, just update Redis
        await redisClient.set(REDIS_KEY, JSON.stringify(tasks))
          .then(() => console.log("Task added to Redis"))
          .catch(err => {
            throw new Error(`Redis update failed: ${err.message}`);
          });

        // Broadcast updated list from Redis
        io.emit("taskListUpdate", tasks);
      }
    } catch (error) {
      console.error("Error adding task:", error);
      socket.emit("error", "Failed to add task");
    }
  });

  socket.on("update", async (data: { taskIndex: number; newTask: string }) => {
    try {
      const { taskIndex, newTask } = data;
      const cachedTasks = await redisClient.get(REDIS_KEY);
      const tasks = cachedTasks ? JSON.parse(cachedTasks) : [];
      // console.log("Tasks when update", tasks);

      if (tasks.length > 0) {
        if (taskIndex >= 0 && taskIndex < tasks.length) {
          tasks[taskIndex] = newTask;
          console.log(tasks);
          await redisClient.set(REDIS_KEY, JSON.stringify(tasks));
          io.emit("taskListUpdate", tasks);
        } else {
          throw new Error("Invalid task index for Redis update");
        }
      } else {
        const mongoTasks = await Todo.find().sort({ createdAt: 1 });

        if (taskIndex >= 0 && taskIndex < mongoTasks.length) {
          const taskToUpdate = mongoTasks[taskIndex];
          await Todo.updateOne({ _id: taskToUpdate._id }, { task: newTask });

          // Get updated list from MongoDB
          const updatedTasks = await Todo.find().lean();
          const taskList = updatedTasks.map((t: ITodo) => t.task);

          // Broadcast updated list to all clients
          io.emit("taskListUpdate", taskList);
        } else {
          throw new Error("Invalid task index for MongoDB update");
        }
      }
    } catch (error) {
      console.error("Error updating task:", error);
      socket.emit("error", "Failed to update task");
    }
    });
    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  app.get("/", (req: Request, res: Response) => {
    res.json({ message: "workingsdsd" });
  });

  app.use("/", TodoRoutes);

  // app.listen(PORT, async () => {
  //   console.log(`Server is running on PORT http://localhost:${PORT}`);
  // });

  connectMongoDB();
  async function startServer() {
    try {
      await redisClient.connect();

      httpServer.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
      });
    } catch (error) {
      console.error("Server startup error:", error);
    }
  }

  startServer();
