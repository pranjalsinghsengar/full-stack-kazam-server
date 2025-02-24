import { Router } from "express";
import fetchAllTasks from "../controllers/getAll.controller";

const TodoRoutes = Router()

// TodoRoutes.post("/create",)
TodoRoutes.get("/fetchAllTasks", fetchAllTasks)


export default TodoRoutes