import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/connection.js';

const router = express.Router();

// POST /deploy - accepts a GitHub URL, saves to DB, returns a deployment ID
router.post('/', async (req, res) => {
  const { githubUrl } = req.body;
  
  if (!githubUrl) {
    return res.status(400).json({ error: 'GitHub URL is required' });
  }

  const deploymentId = uuidv4();
  const status = 'queued';

  try {
    await db.execute(
      'INSERT INTO deployments (id, github_url, status) VALUES (?, ?, ?)',
      [deploymentId, githubUrl, status]
    );
    res.status(201).json({ deploymentId });
  } catch (err) {
    console.error('Error saving deployment:', err);
    res.status(500).json({ error: 'Failed to save deployment' });
  }
});

// GET /deploy/:id - returns the status of a deployment
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await db.execute(
      'SELECT status FROM deployments WHERE id = ?',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Deployment not found' });
    }

    res.json({ status: rows[0].status });
  } catch (err) {
    console.error('Error fetching deployment status:', err);
    res.status(500).json({ error: 'Failed to fetch status' });
  }
});

export default router;
