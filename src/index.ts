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
import { redisClient } from "./config/redis";

const app = express();
dotenv.config();

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
  },
});

// export const redisClient = createClient({
//   url: "redis://localhost:6379",
// });
// export const process.env.REDIS_KEY as string = "FULLSTACK_TASK_PRANJAL";

const PORT = process.env.PORT || 8080;

app.use(express.json());
app.use(cors());

io.on("connection", async (socket: Socket) => {
  console.log("new client connected", socket.id);

  socket.on("add", async (task: string) => {
    try {

      const cachedTasks = await redisClient.get(process.env.REDIS_KEY as string);
      let tasks: string[] = cachedTasks ? JSON.parse(cachedTasks) : [];

      tasks.push(task);

      if (tasks.length >= 50) {
        console.log("Cache exceeded 50 items, moving to MongoDB...");

        const tasksToSave = tasks.map(t => ({
          
          task: t, 
          createdAt: new Date()
        }));
        console.log("tasks",tasks)

        await Todo.insertMany(tasks)
          .then(() => console.log("Successfully moved tasks to MongoDB"))
          .catch(err => {
            throw new Error(`MongoDB insert failed: ${err.message}`);
          });

        tasks = [];
        await redisClient.set(process.env.REDIS_KEY as string, JSON.stringify(tasks))
          .then(() => console.log("Redis cache flushed"))
          .catch(err => {
            throw new Error(`Redis flush failed: ${err.message}`);
          });

        const mongoTasks = await Todo.find().lean();
        const allTasks = mongoTasks.map((t: ITodo) => t.task);
        io.emit("taskListUpdate", allTasks);
      } else {
        await redisClient.set(process.env.REDIS_KEY as string, JSON.stringify(tasks))
          .then(() => console.log("Task added to Redis"))
          .catch(err => {
            throw new Error(`Redis update failed: ${err.message}`);
          });

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
      const cachedTasks = await redisClient.get(process.env.REDIS_KEY as string);
      const tasks = cachedTasks ? JSON.parse(cachedTasks) : [];

      if (tasks.length > 0) {
        if (taskIndex >= 0 && taskIndex < tasks.length) {
          tasks[taskIndex] = newTask;
          console.log(tasks);
          await redisClient.set(process.env.REDIS_KEY as string, JSON.stringify(tasks));
          io.emit("taskListUpdate", tasks);
        } else {
          throw new Error("Invalid task index for Redis update");
        }
      } else {
        const mongoTasks = await Todo.find().sort({ createdAt: 1 });

        if (taskIndex >= 0 && taskIndex < mongoTasks.length) {
          const taskToUpdate = mongoTasks[taskIndex];
          await Todo.updateOne({ _id: taskToUpdate._id }, { task: newTask });

          const updatedTasks = await Todo.find().lean();
          const taskList = updatedTasks.map((t: ITodo) => t.task);

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
