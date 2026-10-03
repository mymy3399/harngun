import React, { useState } from 'react';
import { Share2, Check, Smartphone, X, Layers, Edit3, Plus, User as UserIcon } from 'lucide-react';
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
                  {currentTrip?.name || 'กำลังโหลดทริป...'}
                </h1>
                <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700 flex items-center gap-0.5">
                  <Edit3 className="w-2.5 h-2.5" />
                  <span>แก้ชื่อ</span>
                </span>
              </div>
            )}

            {/* Current user switch dropdown */}
            <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>คุณคือ:</span>
              <div className="relative inline-block">
                <select
                  value={currentUserId}
                  onChange={e => onUserChange(e.target.value)}
                  className="bg-slate-800/90 text-emerald-300 font-semibold px-2 py-0.5 rounded border border-slate-700 focus:border-emerald-500 text-xs outline-none cursor-pointer"
                >
                  {members.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.avatar} {m.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Action buttons: Google Login, Add Expense, Trip Switcher, Share */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* Google Login Profile Button */}
            <button
              onClick={onOpenLogin}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition active:scale-95 border ${
                authUser
                  ? 'bg-slate-800/90 border-emerald-500/50 text-white'
                  : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-200 shadow-sm'
              }`}
              title={authUser ? `เข้าสู่ระบบโดย: ${authUser.name}` : 'เข้าสู่ระบบด้วย Google'}
            >
              {authUser ? (
                <>
                  {authUser.picture ? (
                    <img
                      src={authUser.picture}
                      alt={authUser.name}
                      className="w-4 h-4 rounded-full object-cover"
                    />
                  ) : (
                    <UserIcon className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                  <span className="hidden sm:inline font-semibold truncate max-w-[80px]">
                    {authUser.name.split(' ')[0]}
                  </span>
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span className="hidden sm:inline font-semibold">เข้าสู่ระบบ</span>
                </>
              )}
            </button>

            {/* Prominent Add Expense Button in Header */}
            <button
              onClick={onOpenAddExpense}
              className="flex items-center gap-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-2.5 py-1.5 rounded-xl text-xs font-bold transition active:scale-95 shadow-md shadow-emerald-950/40"
              title="เพิ่มบิลค่าใช้จ่ายใหม่"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span className="whitespace-nowrap">เพิ่มบิล</span>
            </button>

            {/* Trip switcher */}
            <button
              onClick={onOpenTripSwitcher}
              className="flex items-center gap-1 bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/80 px-2 py-1.5 rounded-xl text-xs font-medium transition active:scale-95 shadow-sm"
              title="สลับทริปหรือสร้างทริปใหม่"
            >
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
            </button>

            {/* Share button */}
            <button
              onClick={onOpenShareModal}
              className="flex items-center gap-1 bg-slate-800/80 hover:bg-slate-700 text-emerald-400 border border-slate-700/80 px-2 py-1.5 rounded-xl text-xs font-medium transition active:scale-95 shadow-sm"
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
