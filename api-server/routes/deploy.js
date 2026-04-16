import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/connection.js';
import deployQueue from '../queue.js';

const router = express.Router();

router.post('/', async (req, res) => {
  const { repoUrl } = req.body;
  if (!repoUrl) {
    return res.status(400).json({ error: 'repoUrl is required' });
  }

  const id = uuidv4();

  await db.execute(
    'INSERT INTO deployments (id, repo_url, status) VALUES (?, ?, ?)',
    [id, repoUrl, 'queued']
  );

  await deployQueue.add('deploy', { deploymentId: id, repoUrl });

  res.status(201).json({
    deploymentId: id,
    status: 'queued',
    message: 'Deployment queued successfully'
  });
});

router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const [rows] = await db.execute(
    'SELECT * FROM deployments WHERE id = ?',
    [id]
  );
  if (rows.length === 0) {
    return res.status(404).json({ error: 'Deployment not found' });
  }
  res.json(rows[0]);
});

export default router;
