import { Worker } from 'bullmq';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { runBuild } from './executor.js';

dotenv.config();

const connection = {
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT)
};

const db = await mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

const worker = new Worker('deployments', async (job) => {
  const { deploymentId, repoUrl } = job.data;

  console.log(`Processing job: ${deploymentId}`);
  console.log(`Repo: ${repoUrl}`);

  await db.execute(
    'UPDATE deployments SET status = ? WHERE id = ?',
    ['building', deploymentId]
  );

  console.log(`Status updated to building for: ${deploymentId}`);

  try {
    await runBuild(deploymentId, repoUrl);

    await db.execute(
      'UPDATE deployments SET status = ? WHERE id = ?',
      ['ready', deploymentId]
    );

    console.log(`Deployment ${deploymentId} is ready!`);

  } catch (err) {
    await db.execute(
      'UPDATE deployments SET status = ? WHERE id = ?',
      ['failed', deploymentId]
    );

    console.error(`Deployment ${deploymentId} failed:`, err.message);
  }

}, { connection });

worker.on('completed', (job) => {
  console.log(`Job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.error(`Job ${job.id} failed:`, err.message);
});

console.log('Worker is running and waiting for jobs...');