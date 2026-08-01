<div align="center">

# 🚀 Vercel Clone — Managed Deployment Platform

**Self-Hosted Cloud Infrastructure for Automated Web Application Deployments**

Submit a GitHub repository URL → Vercel Clone provisions an isolated Docker container, clones and builds the project, uploads static output artifacts to AWS S3, and serves live sites dynamically via Nginx reverse proxy subdomains.

[![Node.js](https://img.shields.io/badge/Node.js-v20+-339933?style=flat-square&logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-v4-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com)
[![Docker](https://img.shields.io/badge/Docker-Containers-2496ED?style=flat-square&logo=docker&logoColor=white)](https://www.docker.com)
[![AWS S3](https://img.shields.io/badge/AWS-S3-FF9900?style=flat-square&logo=amazonaws&logoColor=white)](https://aws.amazon.com/s3/)
[![Redis](https://img.shields.io/badge/Redis-BullMQ-DC382D?style=flat-square&logo=redis&logoColor=white)](https://redis.io)
[![Nginx](https://img.shields.io/badge/Nginx-Reverse_Proxy-009639?style=flat-square&logo=nginx&logoColor=white)](https://nginx.org)
[![License](https://img.shields.io/badge/License-ISC-blue?style=flat-square)](LICENSE)

</div>

---

## 📸 How It Works

```
  You submit a GitHub repo URL 
         │
         ▼
  ┌──────────────────────┐
  │   Express API        │  POST /deploy
  │   (api-server)       │──────────────────┐
  └──────────────────────┘                  │
                                            ▼
                                   ┌─────────────────┐
                                   │  BullMQ Queue    │
                                   │  (Redis-backed)  │
                                   └────────┬────────┘
                                            │
                                            ▼
  ┌─────────────────────────────────────────────────────────┐
  │                    Worker Process                       │
  │                                                         │
  │  1. Spin up isolated Docker build container             │
  │  2. Clone GitHub repository inside container            │
  │  3. Execute `npm install` and `npm run build`          │
  │  4. Extract build output (dist/ / build/)               │
  │  5. Recursively upload all static files to AWS S3       │
  │  6. Update database status to 'ready'                   │
  └─────────────────────────────────────────────────────────┘
                          │
                          ▼
  ┌─────────────────────────────────────────────────────────┐
  │                 AWS S3 Cloud Storage                    │
  │  Bucket: deployments/<deploymentId>/*                   │
  └─────────────────────────────────────────────────────────┘
                          │
                          ▼
  ┌─────────────────────────────────────────────────────────┐
  │                  Nginx Reverse Proxy                    │
  │                                                         │
  │  Incoming: http://<deploymentId>.127.0.0.1.sslip.io     │
  │  Proxy Pass → AWS S3 object location                    │
  └─────────────────────────────────────────────────────────┘
```

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| **Automated Build Pipeline** | Clones public GitHub repositories and builds production bundles automatically |
| **Isolated Build Runner** | Runs untrusted user code inside ephemeral Docker containers for maximum security |
| **Async Job Queue** | BullMQ + Redis architecture decouples API HTTP responses from build executions |
| **Cloud Asset Hosting** | Recursively uploads static build outputs (`dist/`, `build/`) to AWS S3 object storage |
| **Dynamic Subdomain Proxy** | Nginx reverse proxy routes wildcard subdomains directly to AWS S3 deployment paths |
| **Status Tracking** | Real-time status tracking stored in MySQL (`queued`, `building`, `ready`, `failed`) |

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **API Server** | Node.js + Express | REST API endpoints for initiating and checking deployments |
| **Database** | MySQL / MariaDB | Persistent storage for deployment records and status tracking |
| **Job Queue** | BullMQ + Redis | Background job scheduling and asynchronous task execution |
| **Build Isolation** | Docker | Ephemeral containerized build runner environment |
| **Cloud Storage** | AWS S3 | Static web asset object storage |
| **Reverse Proxy** | Nginx | Wildcard subdomain extraction & proxy routing |
| **AWS SDK** | `@aws-sdk/client-s3` | Programmatic S3 uploads and asset management |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v20+
- **Docker** installed and running
- **MySQL / MariaDB** database
- **Redis** server
- **AWS S3 Bucket** with IAM credentials

### 1. Clone Repository

```bash
git clone https://github.com/10KRITESH/vercel-clone.git
cd vercel-clone
```

### 2. Set Up Database

```sql
CREATE DATABASE IF NOT EXISTS vercel_clone;
USE vercel_clone;

CREATE TABLE IF NOT EXISTS deployments (
  id VARCHAR(36) PRIMARY KEY,
  repo_url VARCHAR(500) NOT NULL,
  status ENUM('queued', 'building', 'ready', 'failed') DEFAULT 'queued',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 3. Configure Environment

Create `.env` files in both `api-server/` and `worker/` directories:

```env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=vercel_clone

REDIS_HOST=127.0.0.1
REDIS_PORT=6379

AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=ap-south-1
AWS_BUCKET_NAME=kritesh-vercel-clone-outputs
```

### 4. Run Services

```bash
# Terminal 1 — Start API Server
cd api-server && npm install && npm run start

# Terminal 2 — Start Worker Process
cd worker && npm install && node worker.js
```

---

## 📡 API Reference

### `POST /deploy`

Queue a new deployment job for a GitHub repository.

```bash
curl -X POST http://localhost:3000/deploy \
  -H "Content-Type: application/json" \
  -d '{"repoUrl": "https://github.com/user/repo"}'
```

**Response:**
```json
{
  "deploymentId": "b3a1d94e-7f12-4c22-9213-a4e82b7df901",
  "status": "queued",
  "message": "Deployment queued successfully"
}
```

---

### `GET /deploy/:id`

Check the status of an ongoing or completed deployment.

```bash
curl http://localhost:3000/deploy/b3a1d94e-7f12-4c22-9213-a4e82b7df901
```

**Response:**
```json
{
  "id": "b3a1d94e-7f12-4c22-9213-a4e82b7df901",
  "repo_url": "https://github.com/user/repo",
  "status": "ready",
  "created_at": "2026-08-01T14:00:00.000Z"
}
```

---

## 🌐 Subdomain Routing

Once a deployment status reaches `ready`, access the live static site using the deployment ID:

```
http://<deploymentId>.127.0.0.1.sslip.io
```

Nginx extracts `<deploymentId>` from the host header and transparently proxies traffic to:
`https://kritesh-vercel-clone-outputs.s3.ap-south-1.amazonaws.com/deployments/<deploymentId>/index.html`

---

## 📂 Project Structure

```
vercel-clone/
├── api-server/             # Express API Server & queue producer
│   ├── db/                 # Database connection logic
│   ├── routes/             # API routes (/deploy)
│   └── queue.js            # BullMQ producer setup
├── worker/                 # Background build & upload worker
│   ├── executor.js         # Docker runner & Git clone pipeline
│   ├── uploader.js         # AWS S3 recursive uploader
│   └── worker.js           # BullMQ consumer entry point
├── proxy/                  # Nginx Reverse Proxy
│   └── nginx.conf          # Wildcard subdomain proxy rules
├── docker/                 # Build Runner Container
│   └── Dockerfile          # Ephemeral build image configuration
├── .env                    # Environment variables
└── README.md
```

---

## 📄 License

This project is licensed under the [ISC License](https://opensource.org/licenses/ISC).

---

<div align="center">

**Built by [Kritesh Goud](https://github.com/10KRITESH)**

</div>
