import { Router } from 'express';
import { db } from '../db.js';

export const membersRouter = Router({ mergeParams: true });

// GET trip members
membersRouter.get('/', (req, res) => {
  try {
    const { tripId } = req.params;
    const members = db.prepare(`
      SELECT * FROM members WHERE trip_id = ? ORDER BY created_at ASC
    `).all(tripId);
    res.json(members);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST add new member
membersRouter.post('/', (req, res) => {
  try {
    const { tripId } = req.params;
    const { name, promptPay, avatar } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Member name is required' });
    }

    const memberId = `m-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;

    db.transaction(() => {
      db.prepare(`
        INSERT INTO members (id, trip_id, name, promptpay, avatar, created_at)
        VALUES (?, ?, ?, ?, ?, datetime('now'))
      `).run(memberId, tripId, name.trim(), promptPay?.trim() || '', avatar || '🧑‍🤝‍🧑');

      db.prepare(`
        INSERT INTO activity_logs (id, trip_id, text, created_at)
        VALUES (?, ?, ?, datetime('now'))
      `).run(`log-${Date.now()}`, tripId, `เพิ่มสมาชิก "${name.trim()}" เข้ากลุ่ม`);
    })();

    const newMember = db.prepare('SELECT * FROM members WHERE id = ?').get(memberId);
    res.status(201).json(newMember);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update member
membersRouter.put('/:memberId', (req, res) => {
  try {
    const { memberId } = req.params;
    const { name, promptPay, avatar } = req.body;
    db.prepare(`
      UPDATE members
      SET name = COALESCE(?, name),
          promptpay = COALESCE(?, promptpay),
          avatar = COALESCE(?, avatar)
      WHERE id = ?
    `).run(name?.trim(), promptPay?.trim(), avatar, memberId);

    const updated = db.prepare('SELECT * FROM members WHERE id = ?').get(memberId);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE member
membersRouter.delete('/:memberId', (req, res) => {
  try {
    const { memberId } = req.params;
    // Check if member has expenses or splits
    const hasExpenses = db.prepare('SELECT id FROM expenses WHERE paid_by_id = ? LIMIT 1').get(memberId);
    const hasSplits = db.prepare('SELECT id FROM expense_splits WHERE member_id = ? LIMIT 1').get(memberId);

    if (hasExpenses || hasSplits) {
      return res.status(400).json({
        error: 'ไม่สามารถลบสมาชิกนี้ได้เนื่องจากมีประวัติบิลค้างอยู่ กรุณาลบบิลที่เกี่ยวข้องก่อน'
      });
    }

    db.prepare('DELETE FROM members WHERE id = ?').run(memberId);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
