import React, { useState } from 'react';
import { X, Plus, Layers, Check, Trash2, ArrowRight } from 'lucide-react';
import { Trip } from '../types';
import { formatBaht, formatDateTimeThai } from '../utils/currency';

interface TripSwitcherModalProps {
  trips: (Trip & { member_count?: number; expense_count?: number; total_expense?: number })[];
  currentTripId: string;
  onSelectTrip: (tripId: string) => void;
  onCreateTrip: (name: string, creatorName?: string, promptPay?: string) => Promise<void>;
  onClose: () => void;
}

export const TripSwitcherModal: React.FC<TripSwitcherModalProps> = ({
  trips,
  currentTripId,
  onSelectTrip,
  onCreateTrip,
  onClose,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newTripName, setNewTripName] = useState('');
  const [creatorName, setCreatorName] = useState('');
  const [promptPay, setPromptPay] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTripName.trim()) return;

    setIsSubmitting(true);
    try {
      await onCreateTrip(newTripName.trim(), creatorName.trim(), promptPay.trim());
      setIsCreating(false);
      setNewTripName('');
      setCreatorName('');
      setPromptPay('');
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
          <h3 className="font-bold text-lg text-white">จัดการและสลับทริป</h3>
        </div>
        <p className="text-xs text-slate-400 mb-4">
          เลือกทริปที่มีอยู่หรือสร้างกลุ่มทริปใหม่ในฐานข้อมูล SQLite
        </p>

        {isCreating ? (
          <form onSubmit={handleCreate} className="space-y-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
            <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">สร้างทริปใหม่</h4>
            <div>
              <label className="block text-[11px] text-slate-300 mb-1">ชื่อทริปหรือกลุ่ม *</label>
              <input
                type="text"
                required
                placeholder="เช่น ทริปทะเลพัทยา 🌊, ทัวร์ญี่ปุ่น 2026 🎌"
                value={newTripName}
                onChange={e => setNewTripName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] text-slate-300 mb-1">ชื่อคุณ (ผู้สร้าง)</label>
                <input
                  type="text"
                  placeholder="เช่น บอส"
                  value={creatorName}
                  onChange={e => setCreatorName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-300 mb-1">พร้อมเพย์ของคุณ</label>
                <input
                  type="text"
                  placeholder="08xxxxxxxx"
                  value={promptPay}
                  onChange={e => setPromptPay(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded-xl text-xs font-medium transition"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !newTripName.trim()}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white py-2 rounded-xl text-xs font-semibold transition"
              >
                {isSubmitting ? 'กำลังสร้าง...' : 'ยืนยันสร้างทริป'}
              </button>
            </div>
          </form>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            <button
              onClick={() => setIsCreating(true)}
              className="w-full py-2.5 px-3 rounded-2xl border border-dashed border-slate-700 hover:border-emerald-500 text-slate-300 hover:text-emerald-400 text-xs font-medium flex items-center justify-center gap-1.5 transition bg-slate-950/40"
            >
              <Plus className="w-4 h-4" />
              <span>+ สร้างกลุ่มทริปใหม่</span>
            </button>

            {trips.map(trip => {
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
                          <span>ใช้งานอยู่</span>
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
            })}
          </div>
        )}
      </div>
    </div>
  );
};
