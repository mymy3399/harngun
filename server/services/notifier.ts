import { db } from '../db.js';

interface TelegramConfig {
  botToken: string;
  chatId: string;
  enabled: boolean;
  tripName: string;
}

/**
 * Fetch Telegram configuration for a given trip
 */
export function getTripTelegramConfig(tripId: string): TelegramConfig | null {
  try {
    const row = db.prepare(`
      SELECT name, telegram_bot_token, telegram_chat_id, telegram_enabled 
      FROM trips 
      WHERE id = ?
    `).get(tripId) as any;

    if (!row) return null;

    const botToken = (row.telegram_bot_token || process.env.TELEGRAM_BOT_TOKEN || '').trim();
    const chatId = (row.telegram_chat_id || process.env.TELEGRAM_DEFAULT_CHAT_ID || '').trim();
    const enabled = Boolean(row.telegram_enabled && botToken && chatId);

    return {
      botToken,
      chatId,
      enabled,
      tripName: row.name,
    };
  } catch (err) {
    console.error('[Notifier] Failed to get trip telegram config:', err);
    return null;
  }
}

/**
 * Send raw HTML message to a Telegram chat via Bot API
 */
export async function sendTelegramMessage(botToken: string, chatId: string, htmlText: string): Promise<{ ok: boolean; description?: string }> {
  try {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: htmlText,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });

    const data = await res.json() as any;
    if (!res.ok || !data.ok) {
      console.warn('[Notifier] Telegram send failed:', data);
      return { ok: false, description: data.description || `HTTP ${res.status}` };
    }

    return { ok: true };
  } catch (err: any) {
    console.error('[Notifier] Network error sending to Telegram:', err);
    return { ok: false, description: err.message || 'Connection error' };
  }
}

/**
 * Category Icon / Label Helper
 */
function getCategoryEmoji(cat: string): string {
  switch (cat) {
    case 'food': return '🍜 อาหาร/เครื่องดื่ม';
    case 'travel': return '🚗 ค่าเดินทาง';
    case 'stay': return '🏠 ที่พัก/ค่าเช่า';
    case 'party': return '🍻 ปาร์ตี้/สังสรรค์';
    case 'ticket': return '🎫 ตั๋ว/กิจกรรม';
    case 'shopping': return '🛒 ช้อปปิ้ง/ซื้อของเข้าบ้าน';
    default: return '📦 ค่าใช้จ่ายทั่วไป';
  }
}

/**
 * Notify when a new expense is added to a group
 */
export async function notifyExpenseCreated(
  tripId: string,
  data: {
    title: string;
    category?: string;
    totalAmount: number;
    paidByName: string;
    splitMemberNames: string[];
    date?: string;
  }
) {
  const config = getTripTelegramConfig(tripId);
  if (!config || !config.enabled) return;

  const catLabel = getCategoryEmoji(data.category || 'other');
  const count = data.splitMemberNames.length;
  const avg = count > 0 ? (data.totalAmount / count).toFixed(2) : data.totalAmount.toFixed(2);
  const formattedTotal = Number(data.totalAmount).toLocaleString('th-TH', { minimumFractionDigits: 2 });
  const membersText = data.splitMemberNames.length > 0 ? data.splitMemberNames.join(', ') : 'สมาชิกทุกคน';

  const message = [
    `🧾 <b>บันทึกค่าใช้จ่ายใหม่</b>`,
    `📂 <b>กลุ่ม:</b> ${escapeHtml(config.tripName)}`,
    `━━━━━━━━━━━━━━━━━━`,
    `📌 <b>รายการ:</b> <code>${escapeHtml(data.title)}</code>`,
    `🏷️ <b>หมวด:</b> ${catLabel}`,
    `💰 <b>ยอดรวม:</b> <b>฿${formattedTotal}</b>`,
    `👤 <b>คนจ่าย:</b> ${escapeHtml(data.paidByName)}`,
    `👥 <b>คนหาร (${count} คน):</b> ${escapeHtml(membersText)}`,
    `💸 <b>เฉลี่ยคนละ:</b> ฿${Number(avg).toLocaleString('th-TH', { minimumFractionDigits: 2 })}`,
    `📅 <b>วันที่:</b> ${data.date || new Date().toISOString().split('T')[0]}`,
    `━━━━━━━━━━━━━━━━━━`,
    `⚡ <i>บันทึกผ่านระบบ หารกัน (Harngun)</i>`,
  ].join('\n');

  await sendTelegramMessage(config.botToken, config.chatId, message);
}

/**
 * Notify when a settlement / debt payment is marked
 */
export async function notifySettlementRecorded(
  tripId: string,
  data: {
    fromName: string;
    toName: string;
    amount: number;
    note?: string;
  }
) {
  const config = getTripTelegramConfig(tripId);
  if (!config || !config.enabled) return;

  const formattedAmount = Number(data.amount).toLocaleString('th-TH', { minimumFractionDigits: 2 });

  const message = [
    `💸 <b>แจ้งเตือนการเคลียร์ยอดเงิน</b>`,
    `📂 <b>กลุ่ม:</b> ${escapeHtml(config.tripName)}`,
    `━━━━━━━━━━━━━━━━━━`,
    `👤 <b>ผู้โอน:</b> ${escapeHtml(data.fromName)}`,
    `➔ <b>ผู้รับ:</b> ${escapeHtml(data.toName)}`,
    `💰 <b>ยอดโอน:</b> <b>฿${formattedAmount}</b>`,
    data.note ? `📝 <b>หมายเหตุ:</b> <i>${escapeHtml(data.note)}</i>\n` : '',
    `✅ <b>สถานะ:</b> เคลียร์ยอดสำเร็จเรียบร้อย`,
    `━━━━━━━━━━━━━━━━━━`,
    `⚡ <i>ระบบหารเงิน Harngun</i>`,
  ].filter(Boolean).join('\n');

  await sendTelegramMessage(config.botToken, config.chatId, message);
}

/**
 * Notify when a new member joins the group
 */
export async function notifyMemberJoined(tripId: string, memberName: string) {
  const config = getTripTelegramConfig(tripId);
  if (!config || !config.enabled) return;

  const message = [
    `🎉 <b>ยินดีต้อนรับสมาชิกใหม่!</b>`,
    `📂 <b>กลุ่ม:</b> ${escapeHtml(config.tripName)}`,
    `━━━━━━━━━━━━━━━━━━`,
    `👤 <b>${escapeHtml(memberName)}</b> ได้เข้าร่วมกลุ่มแชร์ค่าใช้จ่ายแล้ว`,
    `สามารถเริ่มเพิ่มบิลและหารค่าใช้จ่ายร่วมกันได้ทันที ✨`,
    `━━━━━━━━━━━━━━━━━━`,
    `⚡ <i>ระบบหารเงิน Harngun</i>`,
  ].join('\n');

  await sendTelegramMessage(config.botToken, config.chatId, message);
}

function escapeHtml(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
