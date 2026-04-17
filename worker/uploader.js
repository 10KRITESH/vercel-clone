import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";
import mime from "mime-types"; // We'll need to install this for correct Content-Types
import dotenv from "dotenv";

dotenv.config();

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

/**
 * Recursively uploads a directory to S3
 * @param {string} localPath - Path to the local dist/ folder
 * @param {string} deploymentId - Used as the folder name in S3
 */
export async function uploadDirectory(localPath, deploymentId) {
  console.log(`\n--- Starting Upload to S3 [${deploymentId}] ---`);

  async function walkAndUpload(currentDir) {
    const files = fs.readdirSync(currentDir);

    for (const file of files) {
      const filePath = path.join(currentDir, file);
      const isDirectory = fs.lstatSync(filePath).isDirectory();

      if (isDirectory) {
        await walkAndUpload(filePath);
      } else {
        // Calculate the S3 key (path inside the bucket)
        // Example: deployments/uuid-123/assets/index.js
        const relativePath = path.relative(localPath, filePath);
        const s3Key = `deployments/${deploymentId}/${relativePath.replace(/\\/g, "/")}`;

        const fileStream = fs.createReadStream(filePath);
        const contentType = mime.lookup(filePath) || "application/octet-stream";

        const uploadCommand = new PutObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: s3Key,
          Body: fileStream,
          ContentType: contentType,
        });

        try {
          await s3Client.send(uploadCommand);
          console.log(`Uploaded: ${s3Key}`);
        } catch (err) {
          console.error(`Failed to upload ${s3Key}:`, err);
          throw err;
        }
      }
    }
  }

  await walkAndUpload(localPath);
  console.log(`\n--- Upload Success [${deploymentId}] ---`);
}
