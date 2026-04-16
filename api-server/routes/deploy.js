import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/connection.js';

const router = express.Router();

// POST /deploy - accepts a repo URL, saves to DB, returns a deployment ID
router.post('/', async (req, res) => {
  const { repoUrl } = req.body;
  
  if (!repoUrl) {
    return res.status(400).json({ error: 'repoUrl is required' });
  }

  const deploymentId = uuidv4();
  const status = 'queued';

  try {
    await db.execute(
      'INSERT INTO deployments (id, repo_url, status) VALUES (?, ?, ?)',
      [deploymentId, repoUrl, status]
    );
    res.status(201).json({ 
      deploymentId,
      status,
      message: 'Deployment queued successfully'
    });
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
      'SELECT * FROM deployments WHERE id = ?',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Deployment not found' });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error('Error fetching deployment status:', err);
    res.status(500).json({ error: 'Failed to fetch status' });
  }
});

export default router;
