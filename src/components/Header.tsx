import React, { useState } from 'react';
import { Share2, Check, Smartphone, X, Layers, Edit3 } from 'lucide-react';
import { Member, Trip } from '../types';

interface HeaderProps {
  currentTrip: Trip | null;
  members: Member[];
  currentUserId: string;
  onUserChange: (userId: string) => void;
  onUpdateTripName: (name: string) => Promise<void>;
  onOpenTripSwitcher: () => void;
  onOpenShareModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTrip,
  members,
  currentUserId,
  onUserChange,
  onUpdateTripName,
  onOpenTripSwitcher,
  onOpenShareModal,
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
              เว็บแอป <strong>"หารกัน"</strong> รองรับการใช้งานมือถือเต็มรูปแบบ
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
      <header className="p-4 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md sticky top-0 z-30">
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

          {/* Action buttons: Trips Switcher & Share */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={onOpenTripSwitcher}
              className="flex items-center gap-1 bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/80 px-2.5 py-1.5 rounded-xl text-xs font-medium transition active:scale-95 shadow-sm"
              title="สลับทริปหรือสร้างทริปใหม่"
            >
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">ทริป</span>
            </button>

            <button
              onClick={onOpenShareModal}
              className="flex items-center gap-1 bg-slate-800/80 hover:bg-slate-700 text-emerald-400 border border-slate-700/80 px-2.5 py-1.5 rounded-xl text-xs font-medium transition active:scale-95 shadow-sm"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>แชร์</span>
            </button>
          </div>
        </div>
      </header>
    </>
  );
};
