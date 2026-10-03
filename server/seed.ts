import { db } from './db.js';

export function seedInitialData() {
  const existingTrip = db.prepare('SELECT id FROM trips LIMIT 1').get();
  if (existingTrip) {
    return; // Already initialized
  }

  const insertTrip = db.prepare(`
    INSERT INTO trips (id, name, created_at, updated_at)
    VALUES (?, ?, datetime('now'), datetime('now'))
  `);

  const insertMember = db.prepare(`
    INSERT INTO members (id, trip_id, name, promptpay, avatar, created_at)
    VALUES (?, ?, ?, ?, ?, datetime('now'))
  `);

  const insertExpense = db.prepare(`
    INSERT INTO expenses (id, trip_id, title, category, base_amount, has_sc, has_vat, total_amount, paid_by_id, split_type, date, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `);

  const insertSplit = db.prepare(`
    INSERT INTO expense_splits (id, expense_id, member_id, amount, share_count)
    VALUES (?, ?, ?, ?, ?)
  `);

  const insertLog = db.prepare(`
    INSERT INTO activity_logs (id, trip_id, text, created_at)
    VALUES (?, ?, ?, datetime('now'))
  `);

  const seedTx = db.transaction(() => {
    const tripId = 'trip-chiangmai';
    insertTrip.run(tripId, 'แชร์ค่าใช้จ่ายประจำวัน 🍜✨');

    const members = [
      { id: 'm1', name: 'บอส (Boss)', promptPay: '0812345678', avatar: '😎' },
      { id: 'm2', name: 'พลอย (Ploy)', promptPay: '0898765432', avatar: '🌸' },
      { id: 'm3', name: 'เมฆ (Mek)', promptPay: '0911223344', avatar: '🏄‍♂️' },
      { id: 'm4', name: 'ริน (Rin)', promptPay: '0655443322', avatar: '🎧' },
    ];

    for (const m of members) {
      insertMember.run(m.id, tripId, m.name, m.promptPay, m.avatar);
    }

    // Expense 1: ค่าอาหารกลางวัน
    insertExpense.run(
      'exp-1', tripId, 'ค่าอาหารกลางวัน & เครื่องดื่ม', 'food',
      1200, 0, 0, 1200, 'm1', 'EQUAL', '2026-10-02'
    );
    for (const m of members) {
      insertSplit.run(`sp-1-${m.id}`, 'exp-1', m.id, 300, 1);
    }

    // Expense 2: ของใช้ส่วนกลาง
    insertExpense.run(
      'exp-2', tripId, 'ของใช้ส่วนกลาง ซูเปอร์มาร์เก็ต', 'shopping',
      850, 0, 0, 850, 'm2', 'EQUAL', '2026-10-02'
    );
    for (const m of members) {
      insertSplit.run(`sp-2-${m.id}`, 'exp-2', m.id, 212.5, 1);
    }

    // Expense 3: กาแฟและขนมเบรค
    insertExpense.run(
      'exp-3', tripId, 'กาแฟสดและขนมเบรค', 'food',
      420, 0, 0, 420, 'm3', 'EQUAL', '2026-10-03'
    );
    for (const m of members) {
      insertSplit.run(`sp-3-${m.id}`, 'exp-3', m.id, 105, 1);
    }

    insertLog.run(`log-1`, tripId, 'บอส สร้างกลุ่ม "แชร์ค่าใช้จ่ายประจำวัน 🍜✨"');
    insertLog.run(`log-2`, tripId, 'บอส เพิ่มบิล "ค่าอาหารกลางวัน & เครื่องดื่ม" ฿1,200');
    insertLog.run(`log-3`, tripId, 'พลอย เพิ่มบิล "ของใช้ส่วนกลาง ซูเปอร์มาร์เก็ต" ฿850');
    insertLog.run(`log-4`, tripId, 'เมฆ เพิ่มบิล "กาแฟสดและขนมเบรค" ฿420');
  });

  seedTx();
  console.log('✅ Initial daily expense group seeded successfully');
}

/**
 * Bulk test generator for stress testing high volumes of bills
 */
export function generateBulkExpenses(tripId: string, count: number = 50): number {
  const members = db.prepare('SELECT id, name FROM members WHERE trip_id = ?').all(tripId) as { id: string; name: string }[];
  if (!members.length) return 0;

  const sampleTitles = [
    { title: 'มัทฉะลาเต้ คาเฟ่ริมธาร', cat: 'food', baseMin: 180, baseMax: 450 },
    { title: 'ก๋วยเตี๋ยวเรืออยุธยาเจ้าเด็ด', cat: 'food', baseMin: 220, baseMax: 600 },
    { title: 'ซื้อของสดเซเว่น ปาร์ตี้หมูกระทะ', cat: 'food', baseMin: 550, baseMax: 1600 },
    { title: 'ค่าตั๋วเข้าอุทยานดอยอินทนนท์', cat: 'activity', baseMin: 200, baseMax: 800 },
    { title: 'ค่าเช่ารถตู้พร้อมคนขับ', cat: 'transport', baseMin: 2500, baseMax: 4000 },
    { title: 'กาแฟดริปแม่กำปอง', cat: 'food', baseMin: 150, baseMax: 380 },
    { title: 'ไส้อั่ว แคบหมู ของฝากตลาดวโรรส', cat: 'shopping', baseMin: 400, baseMax: 1200 },
    { title: 'ค่าบัตรคอนเสิร์ตริมดอย', cat: 'activity', baseMin: 1200, baseMax: 3500 },
    { title: 'เติมน้ำมัน ปตท. แม่ริม', cat: 'transport', baseMin: 800, baseMax: 1600 },
    { title: 'ขนมขบเคี้ยวและเครื่องดื่มยามดึก', cat: 'food', baseMin: 240, baseMax: 700 },
    { title: 'ค่าจอดรถสนามบิน', cat: 'transport', baseMin: 250, baseMax: 600 },
    { title: 'ค่าซักแห้งโรงแรม', cat: 'stay', baseMin: 300, baseMax: 600 },
    { title: 'ชุดชงชาสมุนไพรชาวเขา', cat: 'shopping', baseMin: 250, baseMax: 900 },
  ];

  const insertExpense = db.prepare(`
    INSERT INTO expenses (id, trip_id, title, category, base_amount, has_sc, has_vat, total_amount, paid_by_id, split_type, date, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', ?))
  `);

  const insertSplit = db.prepare(`
    INSERT INTO expense_splits (id, expense_id, member_id, amount, share_count)
    VALUES (?, ?, ?, ?, 1)
  `);

  const insertLog = db.prepare(`
    INSERT INTO activity_logs (id, trip_id, text, created_at)
    VALUES (?, ?, ?, datetime('now'))
  `);

  let added = 0;
  const bulkTx = db.transaction(() => {
    for (let i = 0; i < count; i++) {
      const sample = sampleTitles[Math.floor(Math.random() * sampleTitles.length)];
      const payer = members[Math.floor(Math.random() * members.length)];
      const base = Math.round(sample.baseMin + Math.random() * (sample.baseMax - sample.baseMin));
      const hasSc = Math.random() > 0.75 ? 1 : 0;
      const hasVat = Math.random() > 0.75 ? 1 : 0;
      let total = base;
      if (hasSc) total += base * 0.10;
      if (hasVat) total += base * 0.07;
      total = Math.round(total * 100) / 100;

      // Random days ago (between 0 and 14 days ago)
      const daysAgo = Math.floor(Math.random() * 14);
      const dateObj = new Date();
      dateObj.setDate(dateObj.getDate() - daysAgo);
      const dateStr = dateObj.toISOString().split('T')[0];

      // Random participant subset (at least 2 members)
      const numParticipants = Math.max(2, Math.floor(Math.random() * members.length) + 1);
      const shuffled = [...members].sort(() => 0.5 - Math.random());
      const participants = shuffled.slice(0, numParticipants);

      const expId = `bulk-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 4)}`;
      insertExpense.run(
        expId, tripId, `${sample.title} #${i + 1}`, sample.cat,
        base, hasSc, hasVat, total, payer.id, 'EQUAL', dateStr, `-${daysAgo} days`
      );

      const shareAmount = Math.round((total / participants.length) * 100) / 100;
      participants.forEach((m, idx) => {
        let finalShare = shareAmount;
        if (idx === participants.length - 1) {
          const others = shareAmount * (participants.length - 1);
          finalShare = Math.round((total - others) * 100) / 100;
        }
        insertSplit.run(`sp-${expId}-${m.id}`, expId, m.id, finalShare);
      });

      added++;
    }

    insertLog.run(`log-bulk-${Date.now()}`, tripId, `สร้างบิลทดสอบชุดใหญ่ ${added} รายการ สำหรับทดสอบระบบ`);
  });

  bulkTx();
  return added;
}
