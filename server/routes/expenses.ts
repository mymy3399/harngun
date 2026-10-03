import { Router } from 'express';
import { db } from '../db.js';
import { generateBulkExpenses } from '../seed.js';

export const expensesRouter = Router({ mergeParams: true });

// GET paginated, searchable, filterable expenses for a trip
expensesRouter.get('/', (req, res) => {
  try {
    const { tripId } = req.params;
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit as string, 10) || 20));
    const offset = (page - 1) * limit;

    const q = (req.query.q as string || '').trim();
    const category = (req.query.category as string || '').trim();
    const paidBy = (req.query.paidBy as string || '').trim();
    const sortBy = (req.query.sortBy as string) === 'amount' ? 'total_amount' : 'date';
    const order = (req.query.order as string) === 'asc' ? 'ASC' : 'DESC';

    const conditions: string[] = ['e.trip_id = ?'];
    const params: any[] = [tripId];

    if (q) {
      conditions.push('(e.title LIKE ?)');
      params.push(`%${q}%`);
    }

    if (category && category !== 'all') {
      conditions.push('e.category = ?');
      params.push(category);
    }

    if (paidBy && paidBy !== 'all') {
      conditions.push('e.paid_by_id = ?');
      params.push(paidBy);
    }

    const whereClause = conditions.join(' AND ');

    // Total count query for pagination
    const countRow = db.prepare(`
      SELECT COUNT(*) as total FROM expenses e WHERE ${whereClause}
    `).get(...params) as { total: number };
    const totalItems = countRow ? countRow.total : 0;

    // Data query
    const expenses = db.prepare(`
      SELECT 
        e.*,
        m.name as payer_name,
        m.avatar as payer_avatar
      FROM expenses e
      JOIN members m ON e.paid_by_id = m.id
      WHERE ${whereClause}
      ORDER BY e.${sortBy} ${order}, e.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset) as any[];

    // Fetch splits for the expenses on this page
    if (expenses.length > 0) {
      const expIds = expenses.map(e => e.id);
      const placeholders = expIds.map(() => '?').join(',');
      const splits = db.prepare(`
        SELECT es.*, m.name as member_name
        FROM expense_splits es
        JOIN members m ON es.member_id = m.id
        WHERE es.expense_id IN (${placeholders})
      `).all(...expIds) as any[];

      const splitMap: Record<string, Record<string, number>> = {};
      const splitDetailsMap: Record<string, any[]> = {};

      splits.forEach(s => {
        if (!splitMap[s.expense_id]) splitMap[s.expense_id] = {};
        if (!splitDetailsMap[s.expense_id]) splitDetailsMap[s.expense_id] = [];

        splitMap[s.expense_id][s.member_id] = s.amount;
        splitDetailsMap[s.expense_id].push(s);
      });

      expenses.forEach(e => {
        e.splits = splitMap[e.id] || {};
        e.split_details = splitDetailsMap[e.id] || [];
      });
    }

    res.json({
      data: expenses,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST add new expense with splits
expensesRouter.post('/', (req, res) => {
  try {
    const { tripId } = req.params;
    const {
      title,
      category = 'other',
      baseAmount,
      hasSC = false,
      hasVat = false,
      totalAmount,
      paidById,
      splitType = 'EQUAL',
      splits = {},
      date,
      receiptImage = null,
      creatorName = 'สมาชิก',
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }
    if (!totalAmount || totalAmount <= 0) {
      return res.status(400).json({ error: 'Valid total amount is required' });
    }
    if (!paidById) {
      return res.status(400).json({ error: 'Payer is required' });
    }

    const expenseId = `exp-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const finalDate = date || new Date().toISOString().split('T')[0];

    const createTx = db.transaction(() => {
      // 1. Insert expense
      db.prepare(`
        INSERT INTO expenses (
          id, trip_id, title, category, base_amount, has_sc, has_vat,
          total_amount, paid_by_id, split_type, receipt_image, date, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `).run(
        expenseId,
        tripId,
        title.trim(),
        category,
        parseFloat(baseAmount) || totalAmount,
        hasSC ? 1 : 0,
        hasVat ? 1 : 0,
        parseFloat(totalAmount),
        paidById,
        splitType,
        receiptImage,
        finalDate
      );

      // 2. Insert splits
      const insertSplit = db.prepare(`
        INSERT INTO expense_splits (id, expense_id, member_id, amount, share_count)
        VALUES (?, ?, ?, ?, ?)
      `);

      for (const [memberId, amount] of Object.entries(splits)) {
        const numAmt = parseFloat(amount as any);
        if (numAmt > 0) {
          insertSplit.run(
            `sp-${expenseId}-${memberId}`,
            expenseId,
            memberId,
            numAmt,
            1
          );
        }
      }

      // 3. Activity log
      db.prepare(`
        INSERT INTO activity_logs (id, trip_id, text, created_at)
        VALUES (?, ?, ?, datetime('now'))
      `).run(
        `log-${Date.now()}`,
        tripId,
        `${creatorName} เพิ่มบิล "${title.trim()}" ฿${parseFloat(totalAmount).toLocaleString('th-TH')}`
      );
    });

    createTx();

    const created = db.prepare(`
      SELECT e.*, m.name as payer_name, m.avatar as payer_avatar
      FROM expenses e
      JOIN members m ON e.paid_by_id = m.id
      WHERE e.id = ?
    `).get(expenseId);

    res.status(201).json(created);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE expense
expensesRouter.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { tripId } = req.params;
    const { deletedBy = 'สมาชิก' } = req.body || {};

    const exp = db.prepare('SELECT title FROM expenses WHERE id = ?').get(id) as { title: string } | undefined;
    if (!exp) return res.status(404).json({ error: 'Expense not found' });

    db.transaction(() => {
      db.prepare('DELETE FROM expenses WHERE id = ?').run(id);
      db.prepare(`
        INSERT INTO activity_logs (id, trip_id, text, created_at)
        VALUES (?, ?, ?, datetime('now'))
      `).run(`log-${Date.now()}`, tripId, `${deletedBy} ลบบิล "${exp.title}"`);
    })();

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST seed 50+ bulk test bills
expensesRouter.post('/seed-bulk', (req, res) => {
  try {
    const { tripId } = req.params;
    const count = parseInt(req.body.count as string, 10) || 50;
    const added = generateBulkExpenses(tripId, count);
    res.json({ success: true, addedCount: added });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
