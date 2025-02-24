import mongoose from "mongoose";

export const MongoConnect = async () =>{
    await mongoose.connect('mongodb://localhost:27017/todo_db', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    } as mongoose.ConnectOptions);
}