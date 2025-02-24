import { REDIS_KEY, redisClient } from "../index";
import Todo, { ITodo } from "../models/todo";
import { Request, Response } from "express";

interface TaskResponse {
  tasks: string[];
}

const fetchAllTasks = async (req: Request, res: Response): Promise<void> => {
  try {
    // Check Redis cache first
    const cachedTasks = await redisClient.get(REDIS_KEY);
    let tasks: string[] = cachedTasks ? JSON.parse(cachedTasks) : [];

    if (tasks.length === 0) {
      // Fetch from MongoDB if cache is empty
      const mongoTasks = await Todo.find()
      tasks = mongoTasks.map((t: ITodo) => t.task);

      // Update Redis cache with 1-hour expiration
      await redisClient.setEx(REDIS_KEY, 3600, JSON.stringify(mongoTasks));
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