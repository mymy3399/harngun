import { Router } from 'express';
import { db } from '../db.js';

export const logsRouter = Router({ mergeParams: true });

// GET trip logs
logsRouter.get('/', (req, res) => {
  try {
    const { tripId } = req.params;
    const logs = db.prepare(`
      SELECT * FROM activity_logs
      WHERE trip_id = ?
      ORDER BY created_at DESC
      LIMIT 50
    `).all(tripId);
    res.json(logs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST add log
logsRouter.post('/', (req, res) => {
  try {
    const { tripId } = req.params;
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Log text is required' });
    }

    const id = `log-${Date.now()}`;
    db.prepare(`
      INSERT INTO activity_logs (id, trip_id, text, created_at)
      VALUES (?, ?, ?, datetime('now'))
    `).run(id, tripId, text.trim());

    const created = db.prepare('SELECT * FROM activity_logs WHERE id = ?').get(id);
    res.status(201).json(created);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
