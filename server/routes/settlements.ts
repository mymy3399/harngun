import { Router } from 'express';
import { db } from '../db.js';
import { notifySettlementRecorded } from '../services/notifier.js';

export const settlementsRouter = Router({ mergeParams: true });

// GET trip settlement history
settlementsRouter.get('/', (req, res) => {
  try {
    const { tripId } = req.params;
    const list = db.prepare(`
      SELECT 
        s.*,
        m1.name as from_name,
        m1.avatar as from_avatar,
        m2.name as to_name,
        m2.avatar as to_avatar
      FROM settlements s
      JOIN members m1 ON s.from_member_id = m1.id
      JOIN members m2 ON s.to_member_id = m2.id
      WHERE s.trip_id = ?
      ORDER BY s.settled_at DESC
    `).all(tripId);

    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST record new settlement payment
settlementsRouter.post('/', (req, res) => {
  try {
    const { tripId } = req.params;
    const { fromMemberId, toMemberId, amount, note } = req.body;

    if (!fromMemberId || !toMemberId || !amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid from, to, and amount are required' });
    }

    const id = `stl-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;

    const fromMember = db.prepare('SELECT name FROM members WHERE id = ?').get(fromMemberId) as any;
    const toMember = db.prepare('SELECT name FROM members WHERE id = ?').get(toMemberId) as any;

    db.transaction(() => {
      db.prepare(`
        INSERT INTO settlements (id, trip_id, from_member_id, to_member_id, amount, note, settled_at)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
      `).run(id, tripId, fromMemberId, toMemberId, parseFloat(amount), note || null);

      db.prepare(`
        INSERT INTO activity_logs (id, trip_id, text, created_at)
        VALUES (?, ?, ?, datetime('now'))
      `).run(
        `log-${Date.now()}`,
        tripId,
        `💸 ${fromMember?.name || 'สมาชิก'} โอนเงินเคลียร์ยอด ฿${parseFloat(amount).toLocaleString('th-TH')} ให้ ${toMember?.name || 'สมาชิก'}`
      );
    })();

    // Non-blocking Telegram notification
    notifySettlementRecorded(tripId, {
      fromName: fromMember?.name || 'สมาชิก',
      toName: toMember?.name || 'สมาชิก',
      amount: parseFloat(amount),
      note: note || undefined,
    }).catch(e => console.warn('[SettlementNotifier] Error:', e));

    const created = db.prepare(`
      SELECT 
        s.*,
        m1.name as from_name,
        m1.avatar as from_avatar,
        m2.name as to_name,
        m2.avatar as to_avatar
      FROM settlements s
      JOIN members m1 ON s.from_member_id = m1.id
      JOIN members m2 ON s.to_member_id = m2.id
      WHERE s.id = ?
    `).get(id);

    res.status(201).json(created);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE undo settlement payment
settlementsRouter.delete('/:settlementId', (req, res) => {
  try {
    const { settlementId } = req.params;
    const stl = db.prepare(`
      SELECT s.*, m1.name as from_name, m2.name as to_name
      FROM settlements s
      JOIN members m1 ON s.from_member_id = m1.id
      JOIN members m2 ON s.to_member_id = m2.id
      WHERE s.id = ?
    `).get(settlementId) as any;

    if (!stl) return res.status(404).json({ error: 'Settlement record not found' });

    db.transaction(() => {
      db.prepare('DELETE FROM settlements WHERE id = ?').run(settlementId);
      db.prepare(`
        INSERT INTO activity_logs (id, trip_id, text, created_at)
        VALUES (?, ?, ?, datetime('now'))
      `).run(
        `log-${Date.now()}`,
        stl.trip_id,
        `ยกเลิกรายการโอนเคลียร์ยอด ฿${stl.amount.toLocaleString('th-TH')} ระหว่าง ${stl.from_name} กับ ${stl.to_name}`
      );
    })();

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
