import { Worker } from 'bullmq';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { runBuild } from './executor.js';
import { uploadDirectory } from './uploader.js';

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
    // 1. Run the build
    await runBuild(deploymentId, repoUrl);

    // 2. Upload the output to S3
    const outputDir = path.resolve(`./builds/${deploymentId}`);
    await uploadDirectory(outputDir, deploymentId);

    // 3. Clean up local build directory after upload
    try {
      console.log(`Cleaning up local build directory: ${outputDir}`);
      fs.rmSync(outputDir, { recursive: true, force: true });
    } catch (cleanupErr) {
      console.warn(`Warning: Could not clean up local directory ${outputDir}:`, cleanupErr.message);
    }

    // 4. Mark as ready
    await db.execute(
      'UPDATE deployments SET status = ? WHERE id = ?',
      ['ready', deploymentId]
    );

    console.log(`Deployment ${deploymentId} is ready and uploaded!`);

  } catch (err) {
    await db.execute(
      'UPDATE deployments SET status = ? WHERE id = ?',
      ['failed', deploymentId]
    );

    console.error(`Deployment ${deploymentId} failed:`, err.message);
  }

}, { 
  connection,
  lockDuration: 300000, // 5 minutes
  lockRenewTime: 150000 // Renew at half-time
});

worker.on('completed', (job) => {
  console.log(`Job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.error(`Job ${job.id} failed:`, err.message);
});

console.log('Worker is running and waiting for jobs...');