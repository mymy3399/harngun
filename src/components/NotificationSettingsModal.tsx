import React, { useState, useEffect } from 'react';
import {
  X,
  Bell,
  Send,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Smartphone,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Volume2,
} from 'lucide-react';
import {
  fetchNotificationSettings,
  updateNotificationSettings,
  testTelegramNotification,
  TripNotificationSettings,
} from '../api/client';
import {
  getNotificationPermission,
  requestNotificationPermission,
  showDeviceNotification,
} from '../utils/notifications';

interface NotificationSettingsModalProps {
  tripId: string;
  tripName: string;
  onClose: () => void;
  onUpdated?: () => void;
}

export const NotificationSettingsModal: React.FC<NotificationSettingsModalProps> = ({
  tripId,
  tripName,
  onClose,
  onUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'telegram' | 'device'>('telegram');

  // Telegram state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingTelegram, setTestingTelegram] = useState(false);
  const [telegramEnabled, setTelegramEnabled] = useState(false);
  const [chatId, setChatId] = useState('');
  const [botToken, setBotToken] = useState('');
  const [hasServerBot, setHasServerBot] = useState(false);
  const [telegramStatus, setTelegramStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showTelegramGuide, setShowTelegramGuide] = useState(false);

  // Device / Mobile state
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [deviceTestSuccess, setDeviceTestSuccess] = useState(false);

  useEffect(() => {
    setPermission(getNotificationPermission());

    const loadSettings = async () => {
      try {
        setLoading(true);
        const data: TripNotificationSettings = await fetchNotificationSettings(tripId);
        setTelegramEnabled(data.telegram_enabled);
        setChatId(data.telegram_chat_id || '');
        setBotToken(data.telegram_bot_token || '');
        setHasServerBot(data.has_server_bot);
      } catch (err: any) {
        console.error('Failed to load notification settings:', err);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [tripId]);

  const handleSaveTelegram = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setTelegramStatus(null);

    try {
      await updateNotificationSettings(tripId, {
        telegram_enabled: telegramEnabled,
        telegram_chat_id: chatId.trim(),
        telegram_bot_token: botToken.trim() || undefined,
      });

      setTelegramStatus({
        type: 'success',
        message: 'บันทึกการตั้งค่าการแจ้งเตือน Telegram เรียบร้อยแล้ว',
      });
      if (onUpdated) onUpdated();
    } catch (err: any) {
      setTelegramStatus({
        type: 'error',
        message: err.message || 'บันทึกการตั้งค่าไม่สำเร็จ',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTestTelegram = async () => {
    setTestingTelegram(true);
    setTelegramStatus(null);

    try {
      const res = await testTelegramNotification(tripId, {
        botToken: botToken.trim() || undefined,
        chatId: chatId.trim() || undefined,
      });

      setTelegramStatus({
        type: 'success',
        message: res.message || 'ส่งข้อความทดสอบเข้า Telegram สำเร็จแล้ว! ตรวจสอบในห้องแชทได้เลย',
      });
    } catch (err: any) {
      setTelegramStatus({
        type: 'error',
        message: err.message || 'ไม่สามารถส่งข้อความทดสอบได้ กรุณาตรวจสอบ Chat ID และ Bot Token',
      });
    } finally {
      setTestingTelegram(false);
    }
  };

  const handleRequestPermission = async () => {
    const res = await requestNotificationPermission();
    setPermission(res);
    if (res === 'granted') {
      showDeviceNotification('เปิดการแจ้งเตือนสำเร็จ!', {
        body: `คุณจะได้รับการแจ้งเตือนค่าใช้จ่ายของกลุ่ม "${tripName}" บนเครื่องนี้`,
      });
    }
  };

  const handleTestDeviceNotification = () => {
    showDeviceNotification(`🔔 ทดสอบแจ้งเตือนกลุ่ม: ${tripName}`, {
      body: 'ระบบหารกัน (Harbgun) ส่งการแจ้งเตือนและสั่นเตือนบนอุปกรณ์ของคุณเรียบร้อยแล้ว!',
    });
    setDeviceTestSuccess(true);
    setTimeout(() => setDeviceTestSuccess(false), 3000);
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl p-5 sm:p-6 shadow-2xl relative max-h-[90vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-full hover:bg-slate-800 text-slate-400 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2.5 bg-gradient-to-tr from-sky-500/20 to-emerald-500/20 text-sky-400 rounded-2xl border border-sky-500/30">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-white">ตั้งค่าการแจ้งเตือน</h3>
            <p className="text-xs text-slate-400 truncate max-w-[280px]">
              กลุ่ม: <strong className="text-slate-200">{tripName}</strong>
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 my-4 p-1 bg-slate-950 rounded-2xl border border-slate-800/80">
          <button
            onClick={() => setActiveTab('telegram')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
              activeTab === 'telegram'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-950/50'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Telegram Bot</span>
            {telegramEnabled && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 ml-1 animate-pulse"></span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('device')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
              activeTab === 'device'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/50'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>มือถือ & บราวเซอร์</span>
            {permission === 'granted' && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 ml-1"></span>
            )}
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {activeTab === 'telegram' && (
            <div>
              {loading ? (
                <div className="py-12 text-center text-xs text-slate-500">
                  กำลังโหลดการตั้งค่า Telegram...
                </div>
              ) : (
                <form onSubmit={handleSaveTelegram} className="space-y-4">
                  {/* Enable Switch */}
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-sm font-semibold text-white block">
                        เปิดการแจ้งเตือนเข้า Telegram
                      </span>
                      <span className="text-xs text-slate-400">
                        แจ้งเตือนทันทีเมื่อมีคนเพิ่มบิล โอนเคลียร์ยอด หรือเข้ากลุ่ม
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={telegramEnabled}
                        onChange={e => setTelegramEnabled(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-500"></div>
                    </label>
                  </div>

                  {/* Chat ID Input */}
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Telegram Chat ID (กลุ่มหรือแชทส่วนตัว) *
                    </label>
                    <input
                      type="text"
                      placeholder="เช่น -1001234567890 หรือ 123456789"
                      value={chatId}
                      onChange={e => setChatId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 font-mono"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      💡 หากเป็นกลุ่ม Telegram ไอดีมักขึ้นต้นด้วยเครื่องหมายลบ เช่น <code>-100...</code>
                    </p>
                  </div>

                  {/* Bot Token Input */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-medium text-slate-300">
                        Telegram Bot Token
                      </label>
                      {hasServerBot && (
                        <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30">
                          ใช้ Bot ระบบได้ (ไม่ต้องกรอก)
                        </span>
                      )}
                    </div>
                    <input
                      type="password"
                      placeholder="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                      value={botToken}
                      onChange={e => setBotToken(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 font-mono"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      เว้นว่างไว้เพื่อใช้ค่าเริ่มต้นของเซิร์ฟเวอร์ หรือใส่โทเค็นของบอทที่คุณสร้างเอง
                    </p>
                  </div>

                  {/* Status Banner */}
                  {telegramStatus && (
                    <div
                      className={`p-3 rounded-2xl text-xs flex items-start gap-2.5 border ${
                        telegramStatus.type === 'success'
                          ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
                          : 'bg-rose-950/60 border-rose-500/40 text-rose-200'
                      }`}
                    >
                      {telegramStatus.type === 'success' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                      )}
                      <span>{telegramStatus.message}</span>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={handleTestTelegram}
                      disabled={testingTelegram || !chatId.trim()}
                      className="flex-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-sky-400 border border-slate-700/80 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition active:scale-95"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{testingTelegram ? 'กำลังส่งทดสอบ...' : '⚡ ทดสอบส่งข้อความ'}</span>
                    </button>

                    <button
                      type="submit"
                      disabled={saving}
                      className="flex-1 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white py-2.5 rounded-xl text-xs font-semibold shadow-md transition active:scale-95"
                    >
                      {saving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
                    </button>
                  </div>

                  {/* Guide Accordion */}
                  <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/60 mt-3">
                    <button
                      type="button"
                      onClick={() => setShowTelegramGuide(!showTelegramGuide)}
                      className="w-full p-3 text-left flex items-center justify-between text-xs text-slate-300 hover:text-white"
                    >
                      <span className="font-semibold flex items-center gap-1.5">
                        <HelpCircle className="w-3.5 h-3.5 text-sky-400" />
                        วิธีสร้าง Bot และหา Chat ID ใน 1 นาที
                      </span>
                      {showTelegramGuide ? (
                        <ChevronUp className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </button>

                    {showTelegramGuide && (
                      <div className="p-3.5 pt-0 text-[11px] text-slate-400 space-y-2 border-t border-slate-800/60">
                        <div className="space-y-1">
                          <strong className="text-white block">1. สร้างบอท Telegram:</strong>
                          <p>
                            เปิด Telegram ค้นหาบอท <strong>@BotFather</strong> แล้วพิมพ์คำสั่ง <code>/newbot</code> ตั้งชื่อและ Username จะได้ <strong>HTTP API Token</strong>
                          </p>
                        </div>
                        <div className="space-y-1">
                          <strong className="text-white block">2. ดึงบอทเข้ากลุ่มของคุณ:</strong>
                          <p>
                            กดเพิ่มสมาชิกในกลุ่ม Telegram ของคุณ แล้วพิมพ์ Username บอท จากนั้นตั้งบอทเป็น <strong>Admin</strong> เพื่อให้มีสิทธิ์ส่งข้อความ
                          </p>
                        </div>
                        <div className="space-y-1">
                          <strong className="text-white block">3. วิธีหา Chat ID ของกลุ่ม:</strong>
                          <p>
                            ดึงบอท <strong>@RawDataBot</strong> หรือ <strong>@userinfobot</strong> เข้ากลุ่ม บอทจะแสดงข้อมูล JSON ให้คัดลอกค่า <code>id</code> (เช่น <code>-100xxxxxxxxxx</code>) มาใส่ในช่อง Chat ID ด้านบน
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </form>
              )}
            </div>
          )}

          {activeTab === 'device' && (
            <div className="space-y-4">
              {/* Permission Card */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-sm font-semibold text-white block">
                    การแจ้งเตือนบนหน้าจออุปกรณ์
                  </span>
                  <span className="text-xs text-slate-400">
                    แสดงป๊อปอัปแจ้งเตือนพร้อมเสียงกริ่งและระบบสั่น
                  </span>
                </div>
                <div className="text-right">
                  {permission === 'granted' ? (
                    <span className="text-[11px] bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 px-2.5 py-1 rounded-full font-semibold">
                      ✅ อนุญาตแล้ว
                    </span>
                  ) : permission === 'denied' ? (
                    <span className="text-[11px] bg-rose-950/80 text-rose-300 border border-rose-500/40 px-2.5 py-1 rounded-full font-semibold">
                      ❌ ถูกบล็อกไว้
                    </span>
                  ) : (
                    <span className="text-[11px] bg-amber-950/80 text-amber-300 border border-amber-500/40 px-2.5 py-1 rounded-full font-semibold">
                      ⚠️ ยังไม่อนุญาต
                    </span>
                  )}
                </div>
              </div>

              {permission !== 'granted' && (
                <button
                  onClick={handleRequestPermission}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-2xl text-xs font-bold transition shadow-lg shadow-emerald-950/60 flex items-center justify-center gap-2 active:scale-95"
                >
                  <Bell className="w-4 h-4" />
                  <span>กดเพื่ออนุญาตการแจ้งเตือนบนอุปกรณ์นี้</span>
                </button>
              )}

              {/* Test Notification Card */}
              <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold text-white">
                    <Volume2 className="w-4 h-4 text-emerald-400" />
                    <span>ทดสอบเสียงและระบบสั่นบนเครื่อง</span>
                  </div>
                  {deviceTestSuccess && (
                    <span className="text-[11px] text-emerald-400 animate-in fade-in">
                      🔔 ยิงแจ้งเตือนสำเร็จ!
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400">
                  กดปุ่มด้านล่างเพื่อทดสอบเสียงสังเคราะห์ Web Audio และการสั่นแจ้งเตือนบนมือถือ
                </p>
                <button
                  type="button"
                  onClick={handleTestDeviceNotification}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 py-2.5 rounded-xl text-xs font-semibold border border-slate-700 transition flex items-center justify-center gap-2 active:scale-95"
                >
                  <span>📲 ทดสอบแจ้งเตือนทันที</span>
                </button>
              </div>

              {/* PWA / Add to Home Screen Tip */}
              <div className="bg-gradient-to-r from-emerald-950/30 via-slate-900 to-sky-950/30 p-4 rounded-2xl border border-emerald-500/30 space-y-1.5">
                <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                  คำแนะนำสำหรับการใช้งานบนมือถือ (iOS / Android)
                </span>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  สำหรับ iPhone / iPad (Safari) หรือมือถือ Android (Chrome) แนะนำให้กดปุ่ม <strong>"แชร์ (Share)"</strong> แล้วเลือก <strong>"เพิ่มไปยังหน้าจอโฮม (Add to Home Screen)"</strong> เพื่อเปิดใช้งานแบบเต็มจอเหมือนแอปพลิเคชันจริง และรับการแจ้งเตือนได้แม่นยำที่สุด
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
