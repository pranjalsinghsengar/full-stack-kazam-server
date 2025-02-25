import { redisClient } from "../config/redis";
// import { REDIS_KEY } from "../index";
import Todo, { ITodo } from "../models/todo";
import { Request, Response } from "express";

interface TaskResponse {
  tasks: string[];
}

const fetchAllTasks = async (req: Request, res: Response): Promise<void> => {
  try {
    const cachedTasks = await redisClient.get(process.env.REDIS_KEY as string);
    let tasks: string[] = cachedTasks ? JSON.parse(cachedTasks) : [];

    if (tasks.length === 0) {
      const mongoTasks = await Todo.find()
      tasks = mongoTasks.map((t: ITodo) => t.task);

      await redisClient.setEx(process.env.REDIS_KEY as string, 3600, JSON.stringify(mongoTasks));
    }

    res.status(200).json({ tasks } satisfies TaskResponse);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to fetch tasks' 
    });
  }
};

export default fetchAllTasks;