import { createClient } from 'redis'; 

const redisHost = process.env.Redis_Host || 'redis-12675.c212.ap-south-1-1.ec2.cloud.redislabs.com';
const redisPort = process.env.Redis_Port || 12675;
const redisUsername = process.env.Redis_Username || 'default';
const redisPassword = process.env.Redis_Password || 'dssYpBnYQrl01GbCGVhVq2e4dYvUrKJB';


export const redisClient = createClient({
  url: `redis://${redisUsername}:${redisPassword}@${redisHost}:${redisPort}`,
});
