# Vercel Clone — Managed Deployment Platform

A self-hosted deployment platform that automates the pipeline from a GitHub repository to a live, hosted URL. This project mimics the core functionality of Vercel by cloning, building, and serving web applications using a modern microservices architecture.

## 🚀 Key Features
- **Automated Build Pipeline:** Clones repositories and runs builds in isolated environments.
- **Microservices Architecture:** Decoupled API and Worker processes for scalability.
- **Asynchronous Processing:** Uses Redis-backed job queues (BullMQ) to handle concurrent deployments.
- **Cloud Storage:** Automatically uploads build artifacts to AWS S3.
- **Dynamic Routing:** Serves deployments on unique subdomains via Nginx reverse proxy.

## 🏗️ Architecture
1. **API Server (Node.js/Express):** Handles deployment requests and status tracking.
2. **Database (MariaDB):** Stores deployment metadata and logs.
3. **Queue (Redis/BullMQ):** Manages asynchronous deployment jobs.
4. **Build Runner (Docker):** Provides isolated containers for cloning and building code.
5. **Storage (AWS S3):** Hosts static build outputs.
6. **Reverse Proxy (Nginx):** Routes subdomain traffic to the corresponding S3 buckets.

## 📂 Project Structure
- `api-server/`: Express API for managing deployments.
- `worker/`: (Phase 2) Background worker for build and upload logic.
- `proxy/`: (Phase 5) Nginx configuration for subdomain routing.
- `docker/`: (Phase 3) Base images for the build containers.

## 🛠️ Tech Stack
- **Backend:** Node.js, Express
- **Database:** MariaDB (MySQL)
- **Task Queue:** BullMQ, Redis
- **Infrastructure:** Docker, AWS S3, Nginx

## 🚦 Current Progress
- [x] **Phase 1: API Server** — Core endpoints and database integration complete.
- [ ] **Phase 2: Queue System** — Implementing Redis & BullMQ integration.
- [ ] **Phase 3: Docker Runner** — Building the isolated container environment.
- [ ] **Phase 4: S3 Integration** — Automated uploads to AWS.
- [ ] **Phase 5: Nginx Proxy** — Dynamic subdomain routing.
