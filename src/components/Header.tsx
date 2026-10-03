import React, { useState } from 'react';
import { Share2, Check, Smartphone, X, Layers, Edit3, Plus, User as UserIcon, Bell } from 'lucide-react';
import { Member, Trip, User } from '../types';

interface HeaderProps {
  currentTrip: Trip | null;
  members: Member[];
  currentUserId: string;
  authUser: User | null;
  onUserChange: (userId: string) => void;
  onUpdateTripName: (name: string) => Promise<void>;
  onOpenTripSwitcher: () => void;
  onOpenShareModal: () => void;
  onOpenAddExpense: () => void;
  onOpenNotificationSettings: () => void;
  onOpenLogin: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTrip,
  members,
  currentUserId,
  authUser,
  onUserChange,
  onUpdateTripName,
  onOpenTripSwitcher,
  onOpenShareModal,
  onOpenAddExpense,
  onOpenNotificationSettings,
  onOpenLogin,
}) => {
  const [editingTitle, setEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(currentTrip?.name || '');
  const [showPwaBanner, setShowPwaBanner] = useState(true);

  const handleSaveTitle = async () => {
    if (tempTitle.trim() && tempTitle.trim() !== currentTrip?.name) {
      await onUpdateTripName(tempTitle.trim());
    }
    setEditingTitle(false);
  };

  return (
    <>
      {/* PWA Banner */}
      {showPwaBanner && (
        <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 px-4 py-2 flex items-center justify-between text-xs text-white shadow-md">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 animate-bounce text-emerald-200" />
            <span>
              เว็บแอป <strong>"หารกัน"</strong> ฟอนต์ Sarabun พร้อมใช้งาน
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                alert(
                  '💡 เคล็ดลับการติดตั้งหน้าจอหลัก (PWA):\n\n• iOS (Safari): แตะไอคอน Share -> "เพิ่มไปยังหน้าจอโฮม" (Add to Home Screen)\n• Android (Chrome): แตะ 3 จุด -> "ติดตั้งแอป" หรือ "เพิ่มลงหน้าจอหลัก"'
                );
              }}
              className="bg-white/20 hover:bg-white/30 px-2 py-0.5 rounded text-[11px] font-medium transition"
            >
              ติดตั้ง
            </button>
            <button
              onClick={() => setShowPwaBanner(false)}
              className="p-1 hover:bg-white/20 rounded text-emerald-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Header Bar */}
      <header className="p-3 sm:p-4 border-b border-slate-800/80 bg-slate-950/95 backdrop-blur-md sticky top-0 z-30">
        <div className="flex items-center justify-between gap-2">
          {/* Trip Info & User Switcher */}
          <div className="flex-1 min-w-0">
            {editingTitle ? (
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={tempTitle}
                  onChange={e => setTempTitle(e.target.value)}
                  className="bg-slate-800 border border-emerald-500 text-white rounded-lg px-2 py-1 text-sm w-full focus:outline-none"
                  autoFocus
                />
                <button
                  onClick={handleSaveTitle}
                  className="p-1.5 bg-emerald-600 rounded-lg text-white text-xs hover:bg-emerald-500"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => {
                  setTempTitle(currentTrip?.name || '');
                  setEditingTitle(true);
                }}
                className="group flex items-center gap-1.5 cursor-pointer"
              >
                <h1 className="font-bold text-base text-white truncate group-hover:text-emerald-400 transition">
                  {currentTrip?.name || 'กำลังโหลดกลุ่ม...'}
                </h1>
                <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700 flex items-center gap-0.5">
                  <Edit3 className="w-2.5 h-2.5" />
                  <span>แก้ชื่อ</span>
                </span>
              </div>
            )}

            {/* Current user switch dropdown */}
            <div className="flex items-center gap-1 mt-0.5 text-[11px] text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0"></span>
              <span className="flex-shrink-0 text-[11px] text-slate-400">คุณคือ:</span>
              <select
                value={currentUserId}
                onChange={e => onUserChange(e.target.value)}
                className="bg-slate-800/95 text-emerald-300 font-semibold px-1.5 py-0.5 rounded-lg border border-slate-700/80 focus:border-emerald-500 text-[11px] outline-none cursor-pointer max-w-[90px] xs:max-w-[120px] sm:max-w-[160px] truncate"
                title="เปลี่ยนมุมมองสมาชิกที่ใช้งาน"
              >
                {members.map(m => {
                  const emoji = !m.avatar || m.avatar.startsWith('http') || m.avatar.length > 8 ? '🧑‍💼' : m.avatar;
                  return (
                    <option key={m.id} value={m.id}>
                      {emoji} {m.name}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* Action buttons: User Profile, Add Expense, Switcher, Bell, Share */}
          <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
            {/* User Profile Button */}
            <button
              onClick={onOpenLogin}
              className={`flex items-center gap-1 px-2 py-1.5 sm:px-2.5 rounded-xl text-xs font-medium transition active:scale-95 border ${
                authUser
                  ? 'bg-slate-800/90 border-emerald-500/50 text-white'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 shadow-sm'
              }`}
              title={authUser ? `บัญชี: ${authUser.name} (${authUser.email})` : 'เข้าสู่ระบบ'}
            >
              {authUser ? (
                <>
                  {authUser.picture && authUser.picture.startsWith('http') ? (
                    <img
                      src={authUser.picture}
                      alt={authUser.name}
                      className="w-4 h-4 rounded-full object-cover"
                    />
                  ) : (
                    <UserIcon className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                  <span className="hidden md:inline font-semibold truncate max-w-[70px]">
                    {authUser.name.split(' ')[0]}
                  </span>
                </>
              ) : (
                <>
                  <UserIcon className="w-3.5 h-3.5 text-slate-300" />
                  <span className="hidden sm:inline font-semibold">เข้าสู่ระบบ</span>
                </>
              )}
            </button>

            {/* Prominent Add Expense Button in Header */}
            <button
              onClick={onOpenAddExpense}
              className="flex items-center gap-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-2 sm:px-2.5 py-1.5 rounded-xl text-xs font-bold transition active:scale-95 shadow-md shadow-emerald-950/40"
              title="เพิ่มบิลค่าใช้จ่ายใหม่"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span className="hidden sm:inline whitespace-nowrap">เพิ่มบิล</span>
            </button>

            {/* Switch Group */}
            <button
              onClick={onOpenTripSwitcher}
              className="flex items-center gap-1 bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/80 p-1.5 sm:px-2 rounded-xl text-xs font-medium transition active:scale-95 shadow-sm"
              title="สลับกลุ่มหรือสร้างกลุ่มใหม่"
            >
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
            </button>

            {/* Notification settings button */}
            <button
              onClick={onOpenNotificationSettings}
              className="relative flex items-center gap-1 bg-slate-800/80 hover:bg-slate-700 text-sky-400 border border-slate-700/80 p-1.5 sm:px-2 rounded-xl text-xs font-medium transition active:scale-95 shadow-sm"
              title="ตั้งค่าแจ้งเตือน Telegram & มือถือ"
            >
              <Bell className="w-3.5 h-3.5" />
              {Boolean(currentTrip?.telegram_enabled) && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-900 animate-pulse"></span>
              )}
            </button>

            {/* Share button */}
            <button
              onClick={onOpenShareModal}
              className="flex items-center gap-1 bg-slate-800/80 hover:bg-slate-700 text-emerald-400 border border-slate-700/80 p-1.5 sm:px-2 rounded-xl text-xs font-medium transition active:scale-95 shadow-sm"
              title="แชร์ลิงก์กลุ่ม"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>
    </>
  );
};
