import { Queue } from 'bullmq';
import dotenv from 'dotenv';
dotenv.config();

const connection = {
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT)
};

const deployQueue = new Queue('deployments', { connection });

export default deployQueue;
