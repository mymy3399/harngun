import { Router } from 'express';
import { db } from '../db.js';

export const balancesRouter = Router({ mergeParams: true });

// GET trip member balances with SQL aggregation
balancesRouter.get('/', (req, res) => {
  try {
    const { tripId } = req.params;

    const rows = db.prepare(`
      SELECT 
        m.id as member_id,
        m.name,
        m.avatar,
        m.promptpay,
        COALESCE((
          SELECT SUM(e.total_amount) 
          FROM expenses e 
          WHERE e.paid_by_id = m.id AND e.trip_id = ?
        ), 0) as total_paid,
        COALESCE((
          SELECT SUM(es.amount) 
          FROM expense_splits es 
          JOIN expenses e ON es.expense_id = e.id 
          WHERE es.member_id = m.id AND e.trip_id = ?
        ), 0) as total_consumed,
        COALESCE((
          SELECT SUM(s.amount) 
          FROM settlements s 
          WHERE s.from_member_id = m.id AND s.trip_id = ?
        ), 0) as settlements_paid,
        COALESCE((
          SELECT SUM(s.amount) 
          FROM settlements s 
          WHERE s.to_member_id = m.id AND s.trip_id = ?
        ), 0) as settlements_received
      FROM members m
      WHERE m.trip_id = ?
      ORDER BY m.created_at ASC
    `).all(tripId, tripId, tripId, tripId, tripId) as any[];

    const balances = rows.map(r => {
      const net = (r.total_paid - r.total_consumed) + (r.settlements_paid - r.settlements_received);
      return {
        member_id: r.member_id,
        name: r.name,
        avatar: r.avatar,
        promptpay: r.promptpay,
        total_paid: Math.round(r.total_paid * 100) / 100,
        total_consumed: Math.round(r.total_consumed * 100) / 100,
        settlements_paid: Math.round(r.settlements_paid * 100) / 100,
        settlements_received: Math.round(r.settlements_received * 100) / 100,
        net_balance: Math.round(net * 100) / 100,
      };
    });

    const totalGroupExpenseRow = db.prepare(`
      SELECT COALESCE(SUM(total_amount), 0) as total
      FROM expenses
      WHERE trip_id = ?
    `).get(tripId) as { total: number };

    res.json({
      balances,
      totalGroupExpense: totalGroupExpenseRow ? totalGroupExpenseRow.total : 0,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
