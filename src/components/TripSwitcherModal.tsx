import React, { useState } from 'react';
import { X, Plus, Layers, Check, ArrowRight, UserPlus, Sparkles } from 'lucide-react';
import { Trip } from '../types';
import { formatBaht } from '../utils/currency';

interface TripSwitcherModalProps {
  trips: (Trip & { member_count?: number; expense_count?: number; total_expense?: number })[];
  currentTripId: string;
  onSelectTrip: (tripId: string) => void;
  onCreateTrip: (name: string, promptPay?: string) => Promise<void>;
  onJoinTrip: (inviteCode: string) => Promise<void>;
  onClose: () => void;
}

export const TripSwitcherModal: React.FC<TripSwitcherModalProps> = ({
  trips,
  currentTripId,
  onSelectTrip,
  onCreateTrip,
  onJoinTrip,
  onClose,
}) => {
  const [mode, setMode] = useState<'list' | 'create' | 'join'>('list');
  const [newTripName, setNewTripName] = useState('');
  const [promptPay, setPromptPay] = useState('');
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTripName.trim()) return;

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await onCreateTrip(newTripName.trim(), promptPay.trim());
      setMode('list');
      setNewTripName('');
      setPromptPay('');
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'สร้างกลุ่มไม่สำเร็จ');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCodeInput.trim()) return;

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await onJoinTrip(inviteCodeInput.trim());
      setMode('list');
      setInviteCodeInput('');
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'เข้าร่วมกลุ่มไม่สำเร็จ');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-5 shadow-2xl relative max-h-[85vh] flex flex-col">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-full hover:bg-slate-800 text-slate-400"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-1">
          <Layers className="w-5 h-5 text-indigo-400" />
          <h3 className="font-bold text-lg text-white">จัดการกลุ่มของคุณ</h3>
        </div>
        <p className="text-xs text-slate-400 mb-4">
          สลับกลุ่มค่าใช้จ่าย สร้างกลุ่มใหม่ หรือเข้าร่วมกลุ่มของเพื่อน
        </p>

        {errorMsg && (
          <div className="mb-3 bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs p-2.5 rounded-xl text-center">
            {errorMsg}
          </div>
        )}

        {/* Mode: Create Trip */}
        {mode === 'create' && (
          <form onSubmit={handleCreate} className="space-y-3 bg-slate-950 p-4 rounded-2xl border border-slate-800 animate-in fade-in">
            <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
              <Plus className="w-3.5 h-3.5" />
              <span>สร้างกลุ่มใหม่</span>
            </h4>
            <div>
              <label className="block text-[11px] text-slate-300 mb-1">ชื่อกลุ่ม *</label>
              <input
                type="text"
                required
                placeholder="เช่น หารค่าข้าวออฟฟิศ 🍜, ค่าน้ำไฟคอนโด 🏢, สังสรรค์วันศุกร์ 🍻"
                value={newTripName}
                onChange={e => setNewTripName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-300 mb-1">พร้อมเพย์ของคุณ (สำหรับรับเงินโอนคืน)</label>
              <input
                type="text"
                placeholder="08xxxxxxxx"
                value={promptPay}
                onChange={e => setPromptPay(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setMode('list')}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded-xl text-xs font-medium transition"
              >
                ย้อนกลับ
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !newTripName.trim()}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white py-2 rounded-xl text-xs font-semibold transition shadow-md"
              >
                {isSubmitting ? 'กำลังสร้าง...' : 'ยืนยันสร้างกลุ่ม'}
              </button>
            </div>
          </form>
        )}

        {/* Mode: Join Trip */}
        {mode === 'join' && (
          <form onSubmit={handleJoin} className="space-y-3 bg-slate-950 p-4 rounded-2xl border border-slate-800 animate-in fade-in">
            <h4 className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1">
              <UserPlus className="w-3.5 h-3.5" />
              <span>เข้าร่วมกลุ่มด้วยรหัสเชิญ</span>
            </h4>
            <div>
              <label className="block text-[11px] text-slate-300 mb-1">รหัสเชิญกลุ่ม (Invite Code) *</label>
              <input
                type="text"
                required
                placeholder="เช่น ABC123"
                value={inviteCodeInput}
                onChange={e => setInviteCodeInput(e.target.value.toUpperCase())}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-center text-white font-mono tracking-widest placeholder-slate-500 focus:outline-none focus:border-sky-500 uppercase"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setMode('list')}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded-xl text-xs font-medium transition"
              >
                ย้อนกลับ
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !inviteCodeInput.trim()}
                className="flex-1 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white py-2 rounded-xl text-xs font-semibold transition shadow-md"
              >
                {isSubmitting ? 'กำลังเข้าร่วม...' : 'เข้าร่วมกลุ่ม'}
              </button>
            </div>
          </form>
        )}

        {/* Mode: List Trips */}
        {mode === 'list' && (
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            <div className="grid grid-cols-2 gap-2 mb-3">
              <button
                onClick={() => setMode('create')}
                className="py-2.5 px-3 rounded-2xl border border-dashed border-emerald-500/50 hover:border-emerald-400 text-emerald-300 hover:text-emerald-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition bg-emerald-950/20"
              >
                <Plus className="w-4 h-4" />
                <span>สร้างกลุ่มใหม่</span>
              </button>

              <button
                onClick={() => setMode('join')}
                className="py-2.5 px-3 rounded-2xl border border-dashed border-sky-500/50 hover:border-sky-400 text-sky-300 hover:text-sky-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition bg-sky-950/20"
              >
                <UserPlus className="w-4 h-4" />
                <span>ใส่รหัสเชิญ</span>
              </button>
            </div>

            {trips.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-xs">
                คุณยังไม่มีกลุ่มค่าใช้จ่าย กดปุ่มด้านบนเพื่อสร้างหรือเข้าร่วมกลุ่ม
              </div>
            ) : (
              trips.map(trip => {
                const isActive = trip.id === currentTripId;
                return (
                  <div
                    key={trip.id}
                    onClick={() => {
                      onSelectTrip(trip.id);
                      onClose();
                    }}
                    className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                      isActive
                        ? 'bg-slate-800/90 border-emerald-500 shadow-md'
                        : 'bg-slate-950/60 border-slate-800 hover:bg-slate-950'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-white truncate">{trip.name}</h4>
                        {isActive && (
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.2 rounded font-medium flex items-center gap-0.5">
                            <Check className="w-2.5 h-2.5" />
                            <span>เปิดอยู่</span>
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
                        <span>{trip.member_count ?? 0} สมาชิก</span>
                        <span>•</span>
                        <span>{trip.expense_count ?? 0} บิล</span>
                        <span>•</span>
                        <span className="font-mono text-emerald-300">
                          ฿{formatBaht(trip.total_expense ?? 0)}
                        </span>
                      </div>
                    </div>

                    <ArrowRight className="w-4 h-4 text-slate-500 flex-shrink-0" />
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};
