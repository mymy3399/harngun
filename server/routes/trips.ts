import { Router } from 'express';
import { db } from '../db.js';

export const tripsRouter = Router();

// GET all trips
tripsRouter.get('/', (req, res) => {
  try {
    const trips = db.prepare(`
      SELECT t.*, 
        (SELECT COUNT(*) FROM members WHERE trip_id = t.id) as member_count,
        (SELECT COUNT(*) FROM expenses WHERE trip_id = t.id) as expense_count,
        COALESCE((SELECT SUM(total_amount) FROM expenses WHERE trip_id = t.id), 0) as total_expense
      FROM trips t
      ORDER BY t.updated_at DESC
    `).all();
    res.json(trips);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET single trip
tripsRouter.get('/:id', (req, res) => {
  try {
    const trip = db.prepare('SELECT * FROM trips WHERE id = ?').get(req.params.id);
    if (!trip) return res.status(404).json({ error: 'Trip not found' });
    res.json(trip);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST create trip
tripsRouter.post('/', (req, res) => {
  try {
    const { name, creatorName, promptPay, avatar } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Trip name is required' });
    }

    const tripId = `trip-${Date.now()}`;
    const memberId = `m-${Date.now()}`;

    const createTx = db.transaction(() => {
      db.prepare(`
        INSERT INTO trips (id, name, created_at, updated_at)
        VALUES (?, ?, datetime('now'), datetime('now'))
      `).run(tripId, name.trim());

      db.prepare(`
        INSERT INTO members (id, trip_id, name, promptpay, avatar, created_at)
        VALUES (?, ?, ?, ?, ?, datetime('now'))
      `).run(
        memberId,
        tripId,
        creatorName && creatorName.trim() ? creatorName.trim() : 'ฉัน',
        promptPay && promptPay.trim() ? promptPay.trim() : '',
        avatar || '😎'
      );

      db.prepare(`
        INSERT INTO activity_logs (id, trip_id, text, created_at)
        VALUES (?, ?, ?, datetime('now'))
      `).run(`log-${Date.now()}`, tripId, `สร้างกลุ่ม "${name.trim()}"`);
    });

    createTx();

    const newTrip = db.prepare('SELECT * FROM trips WHERE id = ?').get(tripId);
    res.status(201).json({ trip: newTrip, defaultMemberId: memberId });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update trip name
tripsRouter.put('/:id', (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Trip name cannot be empty' });
    }
    db.prepare(`
      UPDATE trips SET name = ?, updated_at = datetime('now') WHERE id = ?
    `).run(name.trim(), req.params.id);

    res.json({ success: true, name: name.trim() });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE trip
tripsRouter.delete('/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM trips WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST seed bulk test bills
tripsRouter.post('/:id/seed-bulk', async (req, res) => {
  try {
    const { generateBulkExpenses } = await import('../seed.js');
    const count = parseInt(req.body.count as string, 10) || 50;
    const added = generateBulkExpenses(req.params.id, count);
    res.json({ success: true, addedCount: added });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
