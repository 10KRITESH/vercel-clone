import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import dotenv from "dotenv";
dotenv.config();

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

async function testUpload() {
  const command = new PutObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: "test-connection.txt",
    Body: "Hello from Vercel Clone! Connection successful.",
  });

  try {
    const response = await s3Client.send(command);
    console.log("✅ Success! File uploaded to S3.");
    console.log("Response:", response);
  } catch (err) {
    console.error("❌ Error uploading to S3:");
    console.error(err);
  }
}

testUpload();
