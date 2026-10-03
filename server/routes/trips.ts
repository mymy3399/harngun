import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { notifyMemberJoined, sendTelegramMessage, getTripTelegramConfig } from '../services/notifier.js';

export const tripsRouter = Router();

// GET /api/trips/invite/:code - Public invite preview (before login)
tripsRouter.get('/invite/:code', (req, res) => {
  try {
    const code = req.params.code.toUpperCase().trim();
    const trip = db.prepare(`
      SELECT t.id, t.name, t.invite_code, t.created_at,
        (SELECT COUNT(*) FROM members WHERE trip_id = t.id) as member_count
      FROM trips t
      WHERE t.invite_code = ?
    `).get(code) as any;

    if (!trip) {
      return res.status(404).json({ error: 'ไม่พบกลุ่มตามรหัสเชิญนี้ หรือลิงก์อาจหมดอายุ' });
    }

    res.json(trip);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Protect all following routes with requireAuth
tripsRouter.use(requireAuth);

// POST /api/trips/join - Join trip via invite code
tripsRouter.post('/join', (req: AuthenticatedRequest, res) => {
  try {
    const { inviteCode } = req.body;
    if (!inviteCode || !inviteCode.trim()) {
      return res.status(400).json({ error: 'กรุณาระบุรหัสเชิญเข้ากลุ่ม' });
    }

    const cleanCode = inviteCode.toUpperCase().trim();
    const trip = db.prepare('SELECT id, name FROM trips WHERE invite_code = ?').get(cleanCode) as any;

    if (!trip) {
      return res.status(404).json({ error: 'ไม่พบกลุ่มตามรหัสเชิญนี้' });
    }

    const user = req.user!;

    // Check if user is already a member
    const existingMember = db.prepare(`
      SELECT id FROM members WHERE trip_id = ? AND user_id = ?
    `).get(trip.id, user.id);

    if (existingMember) {
      return res.json({
        success: true,
        alreadyJoined: true,
        tripId: trip.id,
        tripName: trip.name,
      });
    }

    // Add user as member
    const memberId = `m-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;

    db.transaction(() => {
      db.prepare(`
        INSERT INTO members (id, trip_id, user_id, name, promptpay, avatar, role, created_at)
        VALUES (?, ?, ?, ?, ?, ?, 'member', datetime('now'))
      `).run(
        memberId,
        trip.id,
        user.id,
        user.name,
        user.promptpay || '',
        user.picture || '🧑‍🤝‍🧑'
      );

      db.prepare(`
        INSERT INTO activity_logs (id, trip_id, text, created_at)
        VALUES (?, ?, ?, datetime('now'))
      `).run(`log-${Date.now()}`, trip.id, `${user.name} เข้าร่วมกลุ่มผ่านลิงก์เชิญ 🎉`);
    })();

    // Non-blocking notification
    notifyMemberJoined(trip.id, user.name).catch(e => console.warn('[MemberNotifier] Error:', e));

    res.status(201).json({
      success: true,
      tripId: trip.id,
      tripName: trip.name,
      memberId,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET all trips for the authenticated user
tripsRouter.get('/', (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;

    // Fetch trips where user is creator, member, or sample trip
    let trips = db.prepare(`
      SELECT t.*, 
        (SELECT COUNT(*) FROM members WHERE trip_id = t.id) as member_count,
        (SELECT COUNT(*) FROM expenses WHERE trip_id = t.id) as expense_count,
        COALESCE((SELECT SUM(total_amount) FROM expenses WHERE trip_id = t.id), 0) as total_expense
      FROM trips t
      WHERE t.creator_user_id = ? 
         OR t.id IN (SELECT trip_id FROM members WHERE user_id = ?)
         OR t.id = 'trip-chiangmai'
      ORDER BY t.updated_at DESC
    `).all(userId, userId) as any[];

    // Ensure invite_code is present
    trips.forEach(t => {
      if (!t.invite_code) {
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();
        db.prepare('UPDATE trips SET invite_code = ? WHERE id = ?').run(code, t.id);
        t.invite_code = code;
      }
    });

    res.json(trips);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET single trip
tripsRouter.get('/:id', (req: AuthenticatedRequest, res) => {
  try {
    const trip = db.prepare('SELECT * FROM trips WHERE id = ?').get(req.params.id) as any;
    if (!trip) return res.status(404).json({ error: 'Trip not found' });
    res.json(trip);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST create trip
tripsRouter.post('/', (req: AuthenticatedRequest, res) => {
  try {
    const { name, promptPay } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Trip name is required' });
    }

    const user = req.user!;
    const tripId = `trip-${Date.now()}`;
    const memberId = `m-${Date.now()}`;
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    const createTx = db.transaction(() => {
      db.prepare(`
        INSERT INTO trips (id, name, creator_user_id, invite_code, created_at, updated_at)
        VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
      `).run(tripId, name.trim(), user.id, inviteCode);

      db.prepare(`
        INSERT INTO members (id, trip_id, user_id, name, promptpay, avatar, role, created_at)
        VALUES (?, ?, ?, ?, ?, ?, 'owner', datetime('now'))
      `).run(
        memberId,
        tripId,
        user.id,
        user.name,
        promptPay && promptPay.trim() ? promptPay.trim() : (user.promptpay || ''),
        user.picture || '😎'
      );

      db.prepare(`
        INSERT INTO activity_logs (id, trip_id, text, created_at)
        VALUES (?, ?, ?, datetime('now'))
      `).run(`log-${Date.now()}`, tripId, `${user.name} สร้างกลุ่ม "${name.trim()}"`);
    });

    createTx();

    const newTrip = db.prepare('SELECT * FROM trips WHERE id = ?').get(tripId);
    res.status(201).json({ trip: newTrip, defaultMemberId: memberId });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update trip name
tripsRouter.put('/:id', (req: AuthenticatedRequest, res) => {
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
tripsRouter.delete('/:id', (req: AuthenticatedRequest, res) => {
  try {
    db.prepare('DELETE FROM trips WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET trip notification settings
tripsRouter.get('/:id/notifications', (req: AuthenticatedRequest, res) => {
  try {
    const row = db.prepare(`
      SELECT telegram_bot_token, telegram_chat_id, telegram_enabled 
      FROM trips 
      WHERE id = ?
    `).get(req.params.id) as any;

    if (!row) return res.status(404).json({ error: 'Group not found' });

    res.json({
      telegram_bot_token: row.telegram_bot_token || '',
      telegram_chat_id: row.telegram_chat_id || '',
      telegram_enabled: Boolean(row.telegram_enabled),
      has_server_bot: Boolean(process.env.TELEGRAM_BOT_TOKEN),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update trip notification settings
tripsRouter.put('/:id/notifications', (req: AuthenticatedRequest, res) => {
  try {
    const { telegram_bot_token, telegram_chat_id, telegram_enabled } = req.body;
    db.prepare(`
      UPDATE trips 
      SET telegram_bot_token = ?, telegram_chat_id = ?, telegram_enabled = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(
      telegram_bot_token ? telegram_bot_token.trim() : null,
      telegram_chat_id ? telegram_chat_id.trim() : null,
      telegram_enabled ? 1 : 0,
      req.params.id
    );

    res.json({
      success: true,
      telegram_enabled: Boolean(telegram_enabled),
      telegram_chat_id: telegram_chat_id?.trim() || '',
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST test Telegram notification
tripsRouter.post('/:id/test-telegram', async (req: AuthenticatedRequest, res) => {
  try {
    const { botToken, chatId } = req.body;
    const trip = db.prepare('SELECT name, telegram_bot_token, telegram_chat_id FROM trips WHERE id = ?').get(req.params.id) as any;
    if (!trip) return res.status(404).json({ error: 'Group not found' });

    const activeToken = (botToken || trip.telegram_bot_token || process.env.TELEGRAM_BOT_TOKEN || '').trim();
    const activeChatId = (chatId || trip.telegram_chat_id || process.env.TELEGRAM_DEFAULT_CHAT_ID || '').trim();

    if (!activeToken) {
      return res.status(400).json({ error: 'กรุณาระบุ Telegram Bot Token' });
    }
    if (!activeChatId) {
      return res.status(400).json({ error: 'กรุณาระบุ Telegram Chat ID (เช่น -100xxxxxxxxxx หรือไอดีของคุณ)' });
    }

    const testMessage = [
      `🔔 <b>ทดสอบการเชื่อมต่อแจ้งเตือนสำเร็จ!</b>`,
      `📂 <b>กลุ่ม:</b> ${trip.name}`,
      `━━━━━━━━━━━━━━━━━━`,
      `✅ บอทส่งข้อความแจ้งเตือนเข้า Telegram สำเร็จเรียบร้อย`,
      `เมื่อสมาชิกเพิ่มบิล, เคลียร์ยอดเงิน หรือเข้าร่วมกลุ่ม ระบบจะส่งสรุปมาที่นี่อัตโนมัติ 🚀`,
      `━━━━━━━━━━━━━━━━━━`,
      `⚡ <i>ระบบหารเงิน Harbgun</i>`,
    ].join('\n');

    const result = await sendTelegramMessage(activeToken, activeChatId, testMessage);
    if (!result.ok) {
      return res.status(400).json({
        error: result.description || 'ส่งข้อความไม่สำเร็จ กรุณาตรวจสอบว่า Bot Token ถูกต้อง และได้ดึงบอทเข้ากลุ่มพร้อมตั้งเป็น Admin แล้ว',
      });
    }

    res.json({ success: true, message: 'ส่งข้อความแจ้งเตือนเข้า Telegram สำเร็จ!' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST seed bulk test bills
tripsRouter.post('/:id/seed-bulk', async (req: AuthenticatedRequest, res) => {
  try {
    const { generateBulkExpenses } = await import('../seed.js');
    const count = parseInt(req.body.count as string, 10) || 50;
    const added = generateBulkExpenses(req.params.id, count);
    res.json({ success: true, addedCount: added });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

