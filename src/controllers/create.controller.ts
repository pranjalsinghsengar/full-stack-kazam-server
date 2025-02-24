import { Request, Response } from "express";
import Todo from "../models/todo";

export const createTodo = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    interface TodoRequestBody {
      task: string;
      completed?: boolean;
    }

    const { task, completed } = req.body as TodoRequestBody;

    if (!task) {
      res.status(400).json({ error: "Task is required" });
      return;
    }

    const todo = new Todo({
      task,
      completed: completed ?? false,
    });

    const savedTodo = await todo.save();

    res.status(201).json(savedTodo);
  } catch (error) {
    const err = error as Error;
    res.status(500).json({
      error: "Failed to create todo",
      message: err.message,
    });
  }
};
