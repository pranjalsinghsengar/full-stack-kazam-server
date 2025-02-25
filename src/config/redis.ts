import { createClient } from 'redis';
import dotenv from "dotenv";

dotenv.config();

const redisHost = process.env.Redis_Host || 'localhost';
const redisPort = process.env.Redis_Port || 6379;
const redisUsername = process.env.Redis_Username || 'default';
const redisPassword = process.env.Redis_Password || '';

export const redisClient = createClient({
  url: `redis://${redisUsername}:${redisPassword}@${redisHost}:${redisPort}`,
});
