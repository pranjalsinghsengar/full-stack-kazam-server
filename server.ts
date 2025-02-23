import express, { Express, Request, Response } from 'express';
import http from 'http';
import { Server, Socket } from 'socket.io';
import Redis from 'redis';
import { MongoClient, Collection } from 'mongodb';

const app: Express = express();
const server = http.createServer(app);
const io = new Server(server);


const redisClient = Redis.createClient({
    url: 'redis://localhost:6379'
});
const mongoClient = new MongoClient('mongodb://localhost:27017');
const TASK_KEY = 'FULLSTACK_TASK_PRANJAL'; // Replace JOHN with your first name


interface Task {
    item: string;
    createdAt: Date;
}


async function initialize():Promise<void> {
    await redisClient.connect()
    await mongoClient.connect()

}