# Project Summary: Vercel Clone (Phase 1 & 2)

This document explains what has been built so far and how the pieces fit together. Even if you're new to Node.js and Express, this guide will help you understand the "flow" of your application.

---

## 1. High-Level Architecture

Think of the system as two separate "brains" talking to each other through a middleman:

1.  **API Server (The Receptionist):** Receives your request (like "build this GitHub repo"), writes it down in a notebook (MySQL), and puts a "to-do" card in a box (Redis Queue).
2.  **Worker (The Factory Worker):** Constantly watches the box. When a "to-do" card appears, it grabs it, updates the notebook (MySQL) to say "I'm working on it," and gets ready to build the code.

---

## 2. Technology Stack

- **Node.js:** The engine that runs JavaScript on your computer (instead of in a browser).
- **Express:** A tool for Node.js that makes it easy to handle web requests (like `GET` or `POST`).
- **MySQL:** The database where we store information permanently (like a spreadsheet of all deployments).
- **BullMQ + Redis:** Our "Queue" system. **Redis** is a super-fast, temporary storage for our "to-do" cards. **BullMQ** is the tool we use to manage those cards.

---

## 3. Folder & File Breakdown

### `api-server/` (The Receptionist)
*   **`index.js`**: The main entry point. It starts the server and says, "If anyone asks for `/deploy`, send them to `routes/deploy.js`."
*   **`routes/deploy.js`**: This is where the logic for your URL endpoints lives.
    *   `POST /deploy`: Accepts a GitHub URL, generates a unique ID, saves it to MySQL, and adds it to the BullMQ queue.
    *   `GET /deploy/:id`: Checks the MySQL database and tells you the current status (e.g., "queued" or "building").
*   **`db/connection.js`**: Sets up the connection to your MySQL database.
*   **`queue.js`**: Sets up the connection to Redis so the API can "push" jobs into the queue.

### `worker/` (The Factory Worker)
*   **`worker.js`**: This process runs independently. It listens to the "deployments" queue. When a job arrives, it updates the database status to `building`.

---

## 4. The Request Lifecycle (How it works step-by-step)

1.  **You send a POST request** to `http://localhost:3000/deploy` with a GitHub URL.
2.  **`api-server`** receives it.
3.  **Database Entry:** It creates a record in the `deployments` table with a status of `queued`.
4.  **Queue Entry:** It sends a message to **Redis** saying: "Hey, someone needs to build this repo (ID: 123)."
5.  **Worker Pick-up:** The `worker` process (which is just sitting there watching Redis) sees the message.
6.  **Database Update:** The `worker` immediately tells MySQL: "Change the status of ID 123 to `building`."
7.  **Response:** Meanwhile, the `api-server` already told you "Success! Your ID is 123" (even before the worker finished!). This is why it's "asynchronous" — you don't have to wait for the build to finish to get a response.

---

## 5. Current Progress

- ✅ **Phase 1 (API Server):** Done. You can send and track deployments.
- ✅ **Phase 2 (Queue System):** Done. The API and Worker are communicating through Redis.
- 🚀 **Next Up: Phase 3 (Docker Build Runner):** This is where the "real" work starts — actually cloning the code and building it!
