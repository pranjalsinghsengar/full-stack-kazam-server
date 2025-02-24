// server/src/models/todo.ts
import mongoose, { Schema, Document } from "mongoose";

export interface ITodo extends Document {
  task: string;
  completed: boolean;
  createdAt: Date;
}

const TodoSchema: Schema = new Schema({
  task: { type: String, required: true },
  completed: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<ITodo>("Todo", TodoSchema);